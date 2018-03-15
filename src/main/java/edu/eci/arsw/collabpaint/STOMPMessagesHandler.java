/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package edu.eci.arsw.collabpaint;

import edu.eci.arsw.collabpaint.model.Point;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 *
 * @author Fabian Ardila
 */
@Controller
public class STOMPMessagesHandler {

    AtomicInteger numPoints = new AtomicInteger();
    ArrayList<Point> points = new ArrayList<>();

    @Autowired
    SimpMessagingTemplate msgt;

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        points.add(pt);
        System.out.println("Nuevo punto recibido en el servidor!:" + pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
        synchronized (this) {
            if (numPoints.incrementAndGet() >= 4) {
                System.err.println("Send new points!");
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, points);
                points.clear();
                numPoints.set(0);
            }
        }
    }
}
