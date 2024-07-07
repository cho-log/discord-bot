package cholog.github;

import com.fasterxml.jackson.annotation.JsonCreator;

public record PullRequest(
        PullRequestState state,
        CommitPointer head,
        CommitPointer base
) {

    public enum PullRequestState {
        OPEN,
        CLOSED;

        @JsonCreator
        public static PullRequestState fromString(final String state) {
            return switch (state) {
                case "open" -> OPEN;
                case "closed" -> CLOSED;
                default -> throw new IllegalArgumentException("Unknown state: " + state);
            };
        }
    }

    public record CommitPointer(
            String label,
            String ref,
            String sha
    ) {

    }
}
