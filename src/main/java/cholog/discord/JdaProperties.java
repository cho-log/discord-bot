package cholog.discord;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cholog.jda")
public record JdaProperties(
        String token,
        String guildId
) {

}
