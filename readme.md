# Track Maker

This repository hosts the very beginning of a tool I intend on creating for the
purpose of being able to design 3D printable tracks to fit LED strips in. This
tool will be used to design neon-like wall logos made of these 3D printed tracks
glued onto an acrylic sheet and mounted to the wall. The LED strips fit into the
tracks and get soldered together and connected to a barrel jack a wall charger
can be plugged in to make the logo light.

## To-Do

### Implement arc between two points by specifying radius and flip

Currently I am hacking this using the `quadraticCurveTo` canvas context API
method, but it cannot create a perfect circle:

```
a 100 -100 50 false
a 100 100 50 true
a -100 100 50 false
a -100 -100 50 true
```

![](circle.png)

Using `arcTo` or a polyline with calculated midpoints would be much better. True
arc being the preferred option here as a polyline would need to accept a number
of segments to calculate. This value could default to something smooth enough,
like the larger of the two bounding box dimensions, but it would still not be
scalable like a true arc and it would generate large output files.

### Implement OpenSCAD/STL/GCode export

I am not sure if OpenSCAD can do true arcs, or STL for that matter, but GCode
does. I however further do not know if 3D printers actually implement that arc
instruction. There may be optimizations doable such that the arc is true and is
preserved in the OpenSCAD/STL and remains as such in the GCode so that the GCode
that gets generated is small and possibly even prints faster. But maybe this is
not worth the effort.

### Implement making the track thick and generating the walls holding the strips

Right now I am just drawing a stroke going through the coordinates, but the real
end goal is to draw the track thick enough to fit the LED strip as well as the
side walls that keep the LED strip in. This will require some math, so I have
not added it yet.

### Change the coordinate system to match the OpenSCAD one

The vertical axis seems to be reversed in OpenSCAD and probably CAD in general,
so this tool should reflect that.

### Implement zooming the viewport without affecting the coordinates rendered

Implement scaling the viewport using the scroll wheel / gesture, but do not
scale the numbers displayed in the UI hints etc.

### Implement opening a reference to trace over

The main idea of this tool is to enable designing tracks for LED strips that
make up a logo together. To be able to design the logos, often tracing over a
reference is the best way to get a rough sketch out and tweak it further.

I will implement opening up an image and placing it beneath the sketch. I am not
sure about the UI yet, but most likely I will add a new command called `ref` or
`reference` (or both) that will force-open a file selector modal and once the
file is selected, it will automatically add its name as its argument so that it
knows not to ask for the file again.

If the user changes the name, the application will open the file selector modal
again letting them choose another file or cancel. Choosing a new file will make
the file name argument of the command the name of the new file. Canceling will
reset the changes the user made to the file name to the file name selected last.
