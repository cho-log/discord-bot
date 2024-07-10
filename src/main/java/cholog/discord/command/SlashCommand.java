package cholog.discord.command;

import net.dv8tion.jda.api.events.interaction.command.SlashCommandInteractionEvent;
import net.dv8tion.jda.api.interactions.commands.build.OptionData;

import java.util.List;

public interface SlashCommand {

    String commandName();

    String description();

    default List<OptionData> options() {
        return List.of();
    }

    void onEvent(SlashCommandInteractionEvent event);
}
