# virtuallib

![book exterior](http://www.adrianherbez.net/wp-content/uploads/2017/07/book_exterior-246x300.jpg)

![book interior](http://www.adrianherbez.net/wp-content/uploads/2017/07/book_open-1024x594.png)

This project renders a 3D book based on data from archive.org. The controls are as follows:

- space: start/stop the book's rotation
- up/down arrow: open/close the book
- left/right arrows: flip the pages

Right now, it only loads a single book (The Wizard of Oz), but the plan is to make it into a general reader for archive.org book content.

## Implementation

This project uses a lightweight node.js server to massage the metadata from archive.org into a more useable format, which is in turn passed to the client code.

The client code uses Three.JS in order to create the actual book geometry. Note that no 3d files are loaded- instead, all of the geometry is generated on the fly. The major benefits to that are:

- It makes it possible to have books of any size and proportion, and
- It makes it straightforward to smoothly animate the curved surface of the book pages.

## Live demo

To see it in action, head [here](https://fast-crag-65372.herokuapp.com/). Note that it might take a second or two for the heroku instance to spin up.
