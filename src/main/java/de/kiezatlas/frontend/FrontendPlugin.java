package de.kiezatlas.frontend;

import de.deepamehta.core.osgi.PluginActivator;
import de.deepamehta.core.service.Directives;
import de.deepamehta.core.service.PluginService;
import de.deepamehta.core.service.annotation.ConsumesService;

import com.sun.jersey.api.view.Viewable;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

@Path("/kiezatlas-frontend/")
@Produces("text/html")
    public class FrontendPlugin extends PluginActivator {
      @GET
      @Path("index")
	  public Viewable index() {
	  return new Viewable("/index.html", null);
     }
    }