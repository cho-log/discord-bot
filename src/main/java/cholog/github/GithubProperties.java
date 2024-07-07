package cholog.github;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cholog.github")
public record GithubProperties(
        String token,
        String apiVersion
) {

}
