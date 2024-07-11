package cholog.discord.message;

import cholog.github.GithubApi;
import cholog.github.PullRequest;
import cholog.github.PullRequestMergeRequest;
import cholog.github.PullRequestUrl;
import feign.FeignException;
import net.dv8tion.jda.api.events.message.MessageReceivedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public final class GithubPullRequestMergeSubscription implements MessageSubscription {

    private static final Logger log = LoggerFactory.getLogger(GithubPullRequestMergeSubscription.class);

    public static final String DONE_EMOJI_ID = "1189497983142727770";

    private final MessagesProperties properties;

    private final GithubApi githubApi;

    public GithubPullRequestMergeSubscription(
            final MessagesProperties properties,
            final GithubApi githubApi
    ) {
        this.properties = properties;
        this.githubApi = githubApi;
    }

    @Override
    public String channelId() {
        return properties.prMergeChannelId();
    }

    @Override
    public void onEvent(final MessageReceivedEvent event) {
        final var message = event.getMessage();

        final var urls = Arrays.stream(message.getContentRaw().split("\\s+"))
                .map(String::trim)
                .filter(it -> it.startsWith("http"))
                .toList();
        if (urls.isEmpty()) {
            log.debug("No URLs found in message [message={}]", message);
            return;
        }

        final var fails = new HashMap<String, String>();
        for (final String url : urls) {
            final var pullRequestUrl = new PullRequestUrl(url);

            if (properties.isDisallowOrganization(pullRequestUrl.owner())) {
                fails.put(url, pullRequestUrl.owner() + "는 허용하지 않는 조직입니다.");
                continue;
            }
            if (properties.isDisallowRepository(pullRequestUrl.repository())) {
                fails.put(url, pullRequestUrl.repository() + "는 허용하지 않는 저장소입니다.");
                continue;
            }

            final var pullRequest = githubApi.getPullRequest(
                    pullRequestUrl.owner(),
                    pullRequestUrl.repository(),
                    pullRequestUrl.pullNumber()
            );
            if (pullRequest.state() == PullRequest.PullRequestState.CLOSED) {
                fails.put(url, "이미 닫힌 PR입니다.");
                continue;
            }

            final var targetBranch = pullRequest.base().ref();
            if (properties.isDisallowBranch(targetBranch)) {
                fails.put(url, targetBranch + "브랜치에는 머지할 수 없습니다.");
                continue;
            }

            final var mergeRequest = new PullRequestMergeRequest(
                    "고생하셨습니다.",
                    ":tada: PR 머지 완료! :tada:",
                    pullRequest.head().sha(),
                    PullRequestMergeRequest.MergeMethod.SQUASH
            );
            try {
                final var mergeResult = githubApi.mergePullRequest(
                        pullRequestUrl.owner(),
                        pullRequestUrl.repository(),
                        pullRequestUrl.pullNumber(),
                        mergeRequest
                );
                if (!mergeResult.merged()) {
                    fails.put(url, mergeResult.message());
                }
            } catch (final FeignException e) {
                switch (e.status()) {
                    case 403, 404, 409, 422 -> {
                        log.error("Failed to merge PR [url={}]", url, e);
                        fails.put(url, "PR 머지에 실패했습니다. 관리자에게 문의해주세요.");
                    }
                    case 405 -> fails.put(url, "이 PR은 머지할 수 없습니다. 머지가 가능한 상태인지 확인해주세요.");
                }
            }
        }

        final var doneEmoji = Objects.requireNonNull(message.getJDA().getEmojiById(DONE_EMOJI_ID));
        message.addReaction(doneEmoji).queue();
        if (!fails.isEmpty()) {
            final var failMessages = fails.entrySet().stream()
                    .map(entry -> entry.getKey() + ": " + entry.getValue())
                    .collect(Collectors.joining());
            message.reply(failMessages).queue();
        }
    }
}
