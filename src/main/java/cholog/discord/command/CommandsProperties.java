package cholog.discord.command;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cholog.jda.commands")
public record CommandsProperties(
        PrMergeProperties prMerge
) {

    public String prMergeChannelId() {
        return prMerge.channelId();
    }

    public record PrMergeProperties(
            String channelId
    ) {

    }
}
