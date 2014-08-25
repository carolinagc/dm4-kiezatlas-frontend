package de.kiezatlas.frontend;

import de.deepamehta.core.osgi.PluginActivator;
import java.io.InputStream;
import javax.ws.rs.Path;
import javax.ws.rs.GET;
import javax.ws.rs.Produces;

@Path("/website")
public class KiezatlasFrontendPlugin extends PluginActivator {

    @GET
    @Path("/{id}")
    @Produces("text/html")
    public InputStream invokeFrontend() {
        try {
            return dms.getPlugin("de.kiezatlas.frontend").getResourceAsStream("web/index.html");
        } catch (Exception e) {
            throw new RuntimeException("Invoking frontend failed", e);
        }
    }
}
