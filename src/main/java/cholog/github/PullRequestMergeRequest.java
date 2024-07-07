package cholog.github;

public record PullRequestMergeRequest(
        String commitTitle,
        String commitMessage,
        String sha,
        MergeMethod mergeMethod
) {

    public enum MergeMethod {
        MERGE,
        REBASE,
        SQUASH
    }
}
