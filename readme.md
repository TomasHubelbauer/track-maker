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

### Change the coordinate system to match the OpenSCAD one (reversed Y axis)

The vertical axis seems to be reversed in OpenSCAD and probably CAD in general,
so this tool should reflect that.

### Add support for optional arguments and support resizing and cropping the ref

The reference might be able to use some cropping and resizing, but it will not
always be necessary, so for good user experience, let's add support for making
some parameters in `checkArguments` optional. It will likely be enough to make
the first one as optional, but it will mean we need to check and warn when the
follow-on ones aren't marked as such. Maybe it will be better to redo the API of
the `checkArguments` method and have two arrays, one for required and one for
optional parameters. I'll need to think about the effort/gain ratios of various
options here. In the first iteration, I will likely just add the flag to every
argument and should a missing argument error come up, I will wrap that in a
condition not to check that if the argument is optional and probably short
circuit.

### Make the viewport zoom in and out of the point at which the cursor is

Currently it zooms in and out from the origin, but I think this could be
improved.

### Create and add a favicon to the web app

I am thinking a cross-section of the track from an interesting angle so that it
looks 3D.

### Ask whether to save / rewrite the current draft when opening a new file

Currently the draft if thrown away if a file is open while the draft is unsaved.

### Associate opened reference with an existing unsatisfied reference command

In case there are unsatisfied file references in the document and the user opens
a reference file whose name matches one of those unsatisfied references, update
the cache entry so that the local reference becomes resolved and do not add it
as a new reference command on top of the file.

If a reference is opened that has a name that is already in the cache, tell the
user and stop so that we only have unique names in the cache. We can't see the
directory name of the file, so we can't distinguish files by that.

### Warn about local references not being associated with the file while saving

Once the user goes to save the file, if there are local, non-URL references,
tell them these will not be saved with the file and to save the file in a
directory where all the used references are saved by their names used in the
`reference` command.

### Display possible references when there are any in the cache but no match

For local file, non-URL references, if the file name has no match in the cache,
display a different error message from the failure to download one for URL based
references in the line hint. Something like "unknown reference name.ext | known:
1.ext, 2.ext, 3.ext".

Probably offer only cached local file references that are not already used in
the document. But maybe this is not necessary? Not sure yet.

This will make it so that when the user msitakenly changes the reference name in
the source code, they will realize they can fix the name back up and get the
local file reference working again.

If there is nothing to offer in the cache, display a message that encourages the
user to use the Reference button to open references and have the app associate
them by the opened file name to the existing `reference` commands instead of
creating new commands, as per another to-do in this list.

Also display a summary line (as opposed to specific command line hints) in the
UI, either the status bar or the menu bar alongside the Reference button. This
will be a more user friendly message mentioning how to associate references in
general as opposed to a brief command line hint.

### Offer a convenience method for converting URL references to local references

When using URL references, the Render button won't work, because due to CORS,
the canvas is considered to be tainted. I do not think there is a client-side
workaround for this; if there was one, that would be a break in the browser
security model and quickly fixed even if I could make use of it for a while.

But what could be done is to collect all of the URL references, bulk-download
them for the user and the convert the commands to file references based one by
extracting the file names from the URLs. Afterwards, the UI message informing
the user of broken local file references would nudge them to open the references
and they would get associated by name with the now local-based reference
commands.

It would also be good to enable multi-select of references so this this case is
smoother for a large number of references.

For now this is on a backburner as I do not need to render with URL references.

### Consider pulling in something like ThreeJS for 3D preview of the track

It has methods for taking over the canvas for 3D orbital navigation as well as
displaying axis gizmos and so on, so the only question is how much pain will it
be to add it without compromising on runability from the file protocol and if
it has an ESM version.

### Consider grouping the menu items into dropdowns

The structure could be:

- File
  - Open
  - Save
- Export
  - Generate OpenSCAD
  - Generate GCode
  - Export STL
  - Render
- Reference
  - Load
  - Localize

Localize here would be the flow I am considering in another task that would help
convert URL references to local file references so that rendering out the sketch
works without CORS issues.

It could also be called just Download; it would bulk-download all references.
