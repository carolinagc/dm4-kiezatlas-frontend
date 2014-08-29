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
        return getStaticResource("web/index.html");
    }
}
