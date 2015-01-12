# noteeditor

**jQuery plugin for simple one-voice music note editing.**

This plugin adds a simple music note editor onto your web page.

## Demo

Demo is available [here](http://demo.polarfox.ws/jsnoteeditor/).

## Usage

First create en empty DIV element on your HTML page, like this:

        <div class="noteeditor"></div>
Then apply this plugin to it:

        var ne_elems = $('.noteeditor').noteEditor();

## Functions

The plugin has some functions. They are available like this:

		var ne = ne_elems.eq(0); // we'll take only the first element

		ne.func('function_name', arguments);

### getMelodyObject

Returns melody object. Melody object is a javascript object of the following format:

	var obj = {
		"meta": {},
		"notes": [ list_of_notes ]
	}
"meta" element is an empty object. It's reserved for farther development.

"notes" element is a list of note objects. Each note is an object having following elements:
* "element_type" &mdash; can be "note" or "rest".
* "octave" &mdash; octave number. First octave has number 0.
* "staffSteps" &mdash; number of steps on the note staff from note C of the octave 0.
* "notePos" &mdash; note position in octave. This doesn't takes into account note alterations. E.g. note C has position 0, D &mdash; 1, D# &mdash; 1.
* "duration" &mdash; musical duration of the note. E.g. 1 means whole note, 2 &mdash; halfnote, 4 &mdash; quarter note etc.
* "alter" &mdash; note alteration. Can be empty string, "sharp" for sharp note or "bemol" for flat note.
* "dotted" &mdash; indicates whether note is dotted or not. Can be true or false.
* "note_id" &mdash; note ID. Note C of the octave 0 has ID 0. Each half tone up increments ID by one, each half tone down decrements ID by one. E.g. C0 has ID 0, C#0 has ID 1, B-1 has ID -1.
* "lyrics" &mdash; lyric text corresponding to this note.
* "tabs" &mdash; tabs text corresponding to this note. This element is optional.

So we can get some thing like this:

		{
			"meta": {},
			"notes": [
				{"element_type":"note","octave":0,"staffSteps":3,"notePos":3,"duration":8,"alter":"","dotted":false,"note_id":5,"lyrics":"Some","tabs":"(5)"},
				{"element_type":"rest","octave":0,"staffSteps":4,"notePos":4,"duration":1,"alter":"","dotted":false,"note_id":7,"lyrics":"","tabs":""},
				{"element_type":"note","octave":0,"staffSteps":2,"notePos":2,"duration":8,"alter":"","dotted":false,"note_id":4,"lyrics":"","tabs":"5"},
				{"element_type":"note","octave":0,"staffSteps":1,"notePos":1,"duration":8,"alter":"","dotted":false,"note_id":2,"lyrics":"song","tabs":"(4)"},
				{"element_type":"note","octave":-1,"staffSteps":-1,"notePos":6,"duration":8,"alter":"bemol","dotted":false,"note_id":-2,"lyrics":"","tabs":"(3)'"},
				{"element_type":"note","octave":0,"staffSteps":0,"notePos":0,"duration":8,"alter":"","dotted":false,"note_id":0,"lyrics":"lyrics","tabs":"4"}
			]
		}

### getJSON

Returns melody object in JSON format.

### getABC

Returns melody in abc notation (visit [http://abcnotation.com](http://abcnotation.com) for more information).

### importFromJSONString

Imports melody from JSON.

Usage:

	ne.func('importFromJSONString', melody_json);

## Options

There is only one possible option yet &mdash; "lang". Sets the language of the hints.
Can be "en" or "ru". "en" is a default value.
Example:
	var ne_elems = $('.noteeditor').noteEditor({lang: 'ru'});

## Requirements

* jQuery
* jQuery UI

## Note symbols

Note symbols are based on note symbols by jaschon ([https://openclipart.org/user-detail/jaschon](https://openclipart.org/user-detail/jaschon))