package cholog.github;

public record PullRequestMergeResult(
        boolean merged,
        String message
) {

}
