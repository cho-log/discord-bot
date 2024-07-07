package cholog.discord.command;

import cholog.discord.SlashCommand;
import cholog.github.GithubApi;
import cholog.github.PullRequest;
import cholog.github.PullRequestMergeRequest;
import cholog.github.PullRequestUrl;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.OptionType;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

import static java.util.Objects.requireNonNull;

@Component
public final class GithubPullRequestMergeCommand implements SlashCommand {

    private static final String PR_URL_OPTION_NAME = "pr-url";

    private final CommandsProperties properties;

    private final GithubApi githubApi;

    public GithubPullRequestMergeCommand(
            final CommandsProperties properties,
            final GithubApi githubApi
    ) {
        this.properties = properties;
        this.githubApi = githubApi;

    }

    @Override
    public String commandName() {
        return "pr-merge";
    }

    @Override
    public String description() {
        return "Github PR 머지 요청을 합니다.";
    }

    @Override
    public List<OptionData> options() {
        return List.of(
                new OptionData(OptionType.STRING, PR_URL_OPTION_NAME, "Github PR URL", true)
        );
    }

    @Override
    public void onEvent(final SlashCommandInteractionEvent event) {
        final var url = requireNonNull(event.getOption(PR_URL_OPTION_NAME)).getAsString();
        final var pullRequestUrl = new PullRequestUrl(url);

        if (!Objects.equals(pullRequestUrl.owner(), "cho-log")) {
            event.reply("cholog의 PR만 머지할 수 있습니다.").queue();
            final var warningMessage = "[경고] " + event.getUser().getEffectiveName() + "(" + event.getUser().getName() + ") 유저가 " + url + " PR을 머지하려 했습니다.";
            sendToMergeChannel(event.getJDA(), warningMessage);
            return;
        }

        final var pullRequest = githubApi.getPullRequest(
                pullRequestUrl.owner(),
                pullRequestUrl.repository(),
                pullRequestUrl.pullNumber()
        );
        if (pullRequest.state() == PullRequest.PullRequestState.CLOSED) {
            event.reply("이미 닫힌 PR입니다.").queue();
            return;
        }

        final var targetBranch = pullRequest.base().ref();
        if (targetBranch.contains("main") || targetBranch.contains("master")) {
            event.reply("main 또는 master 브랜치에는 머지할 수 없습니다.").queue();
            return;
        }

        final var mergeRequest = new PullRequestMergeRequest(
                "고생하셨습니다.",
                ":tada: PR 머지 완료! :tada:",
                pullRequest.head().sha(),
                PullRequestMergeRequest.MergeMethod.SQUASH
        );
        final var mergeResult = githubApi.mergePullRequest(
                pullRequestUrl.owner(),
                pullRequestUrl.repository(),
                pullRequestUrl.pullNumber(),
                mergeRequest
        );
        if (mergeResult.merged()) {
            event.reply("PR 머지 완료!").queue();
            final var successMessage = event.getUser().getEffectiveName() + "(" + event.getUser().getName() + ") 유저가 " + url + " PR을 머지했습니다.";
            sendToMergeChannel(event.getJDA(), successMessage);
        } else {
            event.reply("[실패] " + mergeResult.message()).queue();
        }
    }

    private void sendToMergeChannel(
            final JDA jda,
            final String message
    ) {
        final var channel = Objects.requireNonNull(jda.getTextChannelById(properties.prMergeChannelId()));
        channel.sendMessage(message).queue();
    }
}
