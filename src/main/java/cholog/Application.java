package cholog;

import net.dv8tion.jda.api.JDA;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;

@Component
@SpringBootApplication
public class Application {

    private final JDA jda;

    public Application(final JDA jda) {
        this.jda = jda;
    }

    public static void main(final String... args) {
        SpringApplication.run(Application.class, args);
    }
}
