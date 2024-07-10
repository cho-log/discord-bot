package cholog.discord;

import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.OnlineStatus;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.dv8tion.jda.api.requests.GatewayIntent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.EnumSet;
import java.util.List;

@Configuration
@EnableConfigurationProperties(JdaProperties.class)
class JdaConfiguration {

    private static final Logger log = LoggerFactory.getLogger(JdaConfiguration.class);

    private final JdaProperties jdaProperties;

    private final List<ListenerAdapter> eventListeners;

    JdaConfiguration(
            final JdaProperties jdaProperties,
            final List<ListenerAdapter> eventListeners
    ) {
        this.jdaProperties = jdaProperties;
        this.eventListeners = eventListeners;
    }

    @Bean
    JDA jda() throws InterruptedException {
        final var intents = EnumSet.of(
                GatewayIntent.GUILD_MESSAGES,
                GatewayIntent.GUILD_MESSAGE_REACTIONS,
                GatewayIntent.GUILD_MEMBERS,
                GatewayIntent.GUILD_VOICE_STATES,
                GatewayIntent.GUILD_PRESENCES,
                GatewayIntent.GUILD_EMOJIS_AND_STICKERS,
                GatewayIntent.DIRECT_MESSAGES,
                GatewayIntent.MESSAGE_CONTENT
        );
        final var jda = JDABuilder.createDefault(jdaProperties.token())
                .setStatus(OnlineStatus.ONLINE)
                .enableIntents(intents)
                .addEventListeners(eventListeners.toArray())
                .build()
                .awaitReady();

        log.debug("JDA is ready");
        return jda;
    }

    @Bean
    Guild guild(final JDA jda) {
        return jda.getGuildById(jdaProperties.guildId());
    }
}
