package cholog.discord.message;

import cholog.github.PullRequestUrl;

import java.util.Arrays;
import java.util.List;

public class GithubPullRequestMergeMessage {

    private final String rawMessage;

    public GithubPullRequestMergeMessage(final String rawMessage) {
        this.rawMessage = rawMessage;
    }

    public List<PullRequestUrl> extractUrls() {
        return Arrays.stream(rawMessage.split("\\s+"))
                .map(String::trim)
                .filter(it -> it.startsWith("http"))
                .map(PullRequestUrl::new)
                .toList();
    }
}
