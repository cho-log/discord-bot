package cholog.github;

public record PullRequestMergeRequest(
        String commitTitle,
        String commitMessage,
        String sha,
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
