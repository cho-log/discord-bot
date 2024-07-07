package cholog.github;

import java.net.URI;

public record PullRequestUrl(URI value) {

    public PullRequestUrl(final String value) {
        this(URI.create(value));
    }

    public String owner() {
        return paths()[1];
    }

    public String repository() {
        return paths()[2];
    }

    public int pullNumber() {
        return Integer.parseInt(paths()[4]);
    }

    private String[] paths() {
        return value.getPath().split("/");
    }
}
