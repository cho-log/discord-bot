package cholog.discord.command;

import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import org.springframework.stereotype.Component;

@Component
public final class PingPongCommand implements SlashCommand {

    @Override
    public String commandName() {
        return "ping";
    }

    @Override
    public String description() {
        return "Ping! Pong!";
    }

    @Override
    public void onEvent(final SlashCommandInteractionEvent event) {
        event.reply("Pong!").queue();
    }
}
