package cholog.github;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PullRequestMergeRequest(
        @JsonProperty("commit_title")
        String commitTitle,
        @JsonProperty("commit_message")
        String commitMessage,
        String sha,
        @JsonProperty("merge_method")
        String mergeMethod
) {

    public PullRequestMergeRequest(
            final String commitTitle,
            final String commitMessage,
            final String sha,
            final MergeMethod mergeMethod
    ) {
        this(commitTitle, commitMessage, sha, mergeMethod.name());
    }

    public enum MergeMethod {
        MERGE,
        REBASE,
        SQUASH
    }
}
