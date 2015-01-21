// noteeditor.js: A one-voice music notes editor.
// Version 0.1.1
// 
// Copyright (c) 2015 Ildar Ahmadullin
// 
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

(function ($) {
	jQuery.fn.noteEditor = function(options) {
		if (options === undefined) {
			options = {};
		}
		if (options.lang === undefined) {
			options.lang = 'en';
		}

		// Strings translations
		messagesTranslations = {
			'en': {
				'deleteButtonTitle': 'Delete selected symbol',
				'deleteButtonTitleRight': 'Delete symbol on the right',
				'deleteButtonTitleLeft': 'Delete symbol on the left',
				'insertNote': 'Insert note',
				'insertRest': 'Insert rest',
				'onOffFlat': 'Flat on/off',
				'onOffSharp': 'Sharp on/off',
				'onOffDotted': 'Dotted on/off',
				'transposeDown': 'Transpose half-step down',
				'transposeUp': 'Transpose half-step up',
				'lyrics': 'Lyrics'
			},
			'ru': {
				'deleteButtonTitle': 'Удалить выбранную ноту',
				'deleteButtonTitleRight': 'Удалить справа от курсора',
				'deleteButtonTitleLeft': 'Удалить слева от курсора',
				'insertNote': 'Вставить ноту',
				'insertRest': 'Вставить паузу',
				'onOffFlat': 'Вкл/выкл бемоль',
				'onOffSharp': 'Вкл/выкл диез',
				'onOffDotted': 'Вкл/выкл увеличение длительности',
				'transposeDown': 'Транспонировать на полтона вниз',
				'transposeUp': 'Транспонировать на полтона вверх',
				'lyrics': 'Слова'
			}
		};
		langMsgs = messagesTranslations[options.lang];

		var C0Y = 182;
		var HalfToneY = 7;
		var CursorInterval = 56;
		var UpperStaffLineStep = 10;
		var LowerStaffLineStep = 2;

		function GetNoteFromY(y) {
			var StaffSteps = (C0Y - y)/HalfToneY;
			
			var Octave = Math.floor(StaffSteps/7);
			var NotePos = StaffSteps % 7;
			if (NotePos < 0) {
				NotePos = NotePos + 7;
			}
			
			return {
				octave: Octave,
				notePos: NotePos,
				staffSteps: StaffSteps
			}
		}

		function ProcessNoteDisplaying(noteElement, staffSteps) {
			if (staffSteps > UpperStaffLineStep) {
				noteElement.addClass('lined');
				var LineElement = noteElement.find('.line');
				LineElement.css('height', (14+(staffSteps-UpperStaffLineStep)*7)+'px');
				// LineElement.css('top', '38px');
				if (staffSteps & 1) {
					// LineElement.css('background-position-y', '7px');
					LineElement.css('top', '45px');
				}
				else {
					// LineElement.css('background-position-y', '0px');
					LineElement.css('top', '38px');
				}
			}
			else if (staffSteps < LowerStaffLineStep) {
				noteElement.addClass('lined');
				var LineElement = noteElement.find('.line');
				var DeltaHeight = (LowerStaffLineStep-staffSteps-2)*7;
				LineElement.css('height', (20+DeltaHeight)+'px');
				LineElement.css('top', (24-DeltaHeight)+'px');
				LineElement.css('background-position-y', '0px');
			}
			else {
				noteElement.removeClass('lined');
			}
		}

		// X-coordinate of staff beginning
		var Left0 = 60;
		// The most left X-coordinate of cursor
		var CursorLeft0 = Left0;
		// X-coordinate of the first note
		var NotesLeft0 = Left0 + 25;
		// X-coordinate of the first lyric
		var LyricsLeft0 = Left0 + 22;

		return this.each(function() {
			function DeselectAllNotes() {
				$('.note').removeClass('selected');
			}
			
			function GetSelectedNote(Elem) {
				if (Elem == null) {
					Elem = Notesheet.find('.note.selected').eq(0);
				}
				
				var NoteIndex = parseInt(Elem.find('input[name="index"]').eq(0).val());
				return {
					elem: Elem,
					index: NoteIndex
				}
			}
			
			function DisableNoteAttributesToolbar() {
				var NoteAttrToolbar = Toolbar.find('.note_attributes').eq(0);
				NoteAttrToolbar.find('input').prop('disabled', true);
				
				Toolbar.find('.delete_note').eq(0).prop('disabled', true);
			}
			
			function EnableNoteAttributesToolbar(name) {
				var NoteAttrToolbar = Toolbar.find('.note_attributes').eq(0);
				if (name) {
					NoteAttrToolbar.find('input[name="'+name+'"]').prop('disabled', false);
				}
				else {
					NoteAttrToolbar.find('input').prop('disabled', false);
				}
				
				Toolbar.find('.delete_note').eq(0).prop('disabled', false);
			}
			
			function LoadNotePropertiesToToolbar(elem) {
				var SelectedNote = GetSelectedNote(elem);
				
				var note = Notes[SelectedNote.index];
				
				if (note.elementType == 'note') {
					EnableNoteAttributesToolbar();
					var NoteAttrToolbar = Toolbar.find('.note_attributes').eq(0);
					
					// alteration
					if (note.alter == 'bemol') {
						NoteAttrToolbar.find('label.checkbox_button input[name="bemol"]').prop('checked', true);
						NoteAttrToolbar.find('label.checkbox_button input[name="sharp"]').prop('checked', false);
					}
					else if (note.alter == 'sharp') {
						NoteAttrToolbar.find('label.checkbox_button input[name="bemol"]').prop('checked', false);
						NoteAttrToolbar.find('label.checkbox_button input[name="sharp"]').prop('checked', true);
					}
					else {
						NoteAttrToolbar.find('label.checkbox_button input[name="bemol"]').prop('checked', false);
						NoteAttrToolbar.find('label.checkbox_button input[name="sharp"]').prop('checked', false);
					}
					
					// dotted
					if (note.dotted == true) {
						NoteAttrToolbar.find('label.checkbox_button input[name="dotted"]').prop('checked', true);						
					}
					else {
						NoteAttrToolbar.find('label.checkbox_button input[name="dotted"]').prop('checked', false);						
					}
				}
				else if (note.elementType == 'rest') {
					EnableNoteAttributesToolbar('dotted');
					var NoteAttrToolbar = Toolbar.find('.note_attributes').eq(0);

					// dotted
					if (note.dotted == true) {
						NoteAttrToolbar.find('label.checkbox_button input[name="dotted"]').prop('checked', true);						
					}
					else {
						NoteAttrToolbar.find('label.checkbox_button input[name="dotted"]').prop('checked', false);						
					}
				}
				else {
					DisableNoteAttributesToolbar();
				}
			}

			function SelectNote(note) {
				CursorOff();
				DeselectAllNotes();
				note.addClass('selected');
				LoadNotePropertiesToToolbar(note);
			}
			
			// Set note element position
			function SetNoteElementPosition(elem, pos) {
				var NewX = NotesLeft0 + pos*CursorInterval;
				elem.find('input[name="index"]').eq(0).val(pos);
				elem.css('left', NewX+'px');
			}
			
			// Returns note ID.
			// Note with ID = 0 is C in the 0th octave.
			// ID = 1 is C# in the 0th octave,
			// ID = 2 is D in the 0th octave,
			// ID = -1 is B in the -1st octave etc.
			function GetNoteID(note, clef) {
				if (clef == null) {
					clef = 'treble';
				}
				
				// Key-value variable: notePosInOctave: noteIdInOctave
				var noteIDs = {
					0: 0, // C
					1: 2, // D
					2: 4, // E
					3: 5, // F
					4: 7, // G
					5: 9, // A
					6: 11 // B
				}
				
				var Ret = note.octave*12 + noteIDs[note.notePos];
				
				if (note.alter == 'sharp') {
					Ret = Ret + 1;
				}
				else if (note.alter == 'bemol') {
					Ret = Ret - 1;
				}
				
				return Ret;
			}
			
			// Returns note by note ID
			function GetNoteByID(noteID) {
				var octave = Math.floor(noteID/12);
				
				var octaveNoteID = noteID % 12;
				if (octaveNoteID < 0) {
					octaveNoteID = octaveNoteID + 12;
				}
				
				// Getting staff steps and alteration
				var notesByID = {
					0: {notePos: 0, alter: ''},
					1: {notePos: 0, alter: 'sharp'},
					2: {notePos: 1, alter: ''},
					3: {notePos: 2, alter: 'bemol'},
					4: {notePos: 2, alter: ''},
					5: {notePos: 3, alter: ''},
					6: {notePos: 3, alter: 'sharp'},
					7: {notePos: 4, alter: ''},
					8: {notePos: 4, alter: 'sharp'},
					9: {notePos: 5, alter: ''},
					10: {notePos: 6, alter: 'bemol'},
					11: {notePos: 6, alter: ''}
				};
				
				var Ret = notesByID[octaveNoteID];
				Ret['octave'] = octave;
				Ret['staffSteps'] = octave*7 + Ret.notePos;
				
				return Ret;
			}

			// Invoked on note addition/removing.
			function ResizeLyricsBar() {
				var NewWidth = NotesLeft0 + Notes.length*CursorInterval + 150;
				LyricsBar.width(NewWidth+'px');
			}

			// Adds note element
			function AddNoteElement(pos, options) {
				// New note element position
				var NewX = NotesLeft0 + pos*CursorInterval;
				var NewY = C0Y - options.staffSteps*HalfToneY;
				
				var DottedClass = '';
				if (options.dotted == true) {
					DottedClass = 'dotted';
				}
				
				var noteElemClass = 'note ';
				if (options.elementType == 'rest') {
					noteElemClass = noteElemClass + 'rest ';
				}
				
				var NewNote = $(
					'<div class="'+noteElemClass+options.elementType+options.duration+' '+options.alter+' '+DottedClass+'">'
						+ '<input type="hidden" name="index" value="' + pos + '"/>'
						+ '<div class="alteration"></div>'
						+ '<div class="dot"></div>'
						+ '<div class="line"></div>'
					+ '</div>'
					);
				NewNote.css('left', NewX+'px');
				NewNote.css('top', NewY+'px');
				Notesheet.append(NewNote);

				if (options.elementType == 'note') {
					ProcessNoteDisplaying(NewNote, options.staffSteps);
					
					NewNote.draggable({
						grid: [CursorInterval, HalfToneY],
						containment: Notesheet,
						scroll: false,
						axis: "y",
						cursor: "move",
						start: function() {
							SelectNote($(this));
						},
						drag: function(event, ui) {
							var p = ui.position;
							var Note = GetNoteFromY(p.top);
							
							ProcessNoteDisplaying($(this), Note.staffSteps);
						},
						stop: function(event, ui) {
							var noteIndex = parseInt($(this).find('input[name="index"]').eq(0).val());
							var note = GetNoteFromY(parseInt($(this).css('top')));
							Notes[noteIndex].staffSteps = note.staffSteps;
							Notes[noteIndex].octave = note.octave;
							Notes[noteIndex].notePos = note.notePos;
						}
					});
				}

				NewNote.click(function() {
					SelectNote($(this));
					return false;
				});

				return NewNote;
			}
			
			function DeleteNoteElement(elem) {
				if (elem.hasClass('selected')) {
					DisableNoteAttributesToolbar();
				}

				elem.remove();
			}
			
			// Shifts a note element horizontally
			function ShiftNoteElement(elem, shiftValue) {
				var NoteIndexElement = elem.find('input[name="index"]').eq(0);
				var NewNoteIndex = parseInt(NoteIndexElement.val()) + shiftValue;
				SetNoteElementPosition(elem, NewNoteIndex);
			}

			// Shifts a lyrics element horizontally.
			// lyric is an element of the Lyrics array.
			function ShiftLyricsElement(index, shiftValue) {
				if (Lyrics[index] != null) {
					var newX = LyricsLeft0 + index*CursorInterval;
					var elem = Lyrics[index].elem;
					elem.css('left', newX+'px');
				}
			}

			// Deletes lyrics element
			function DeleteLyricsElement(index) {
				if (Lyrics[index] != null) {
					Lyrics[index].elem.remove();
					Lyrics[index] = null;
				}
			}

			// Adds note to position
			function AddNote(pos, options) {
				if (pos == null) {
					pos = Notes.length;
				}
				
				if (pos > Notes.length) {
					pos = Notes.length;
				}
				
				// Default options
				Options = {
					elementType: 'note',
					octave: 0,
					notePos: 4,
					staffSteps: 4,
					duration: 8,
					alter: '',
					dotted: false
				};
				$.extend(Options, options);
				
				Notes.splice(pos, 0, {
					elementType: Options.elementType,
					octave: Options.octave,
					staffSteps: Options.staffSteps,
					notePos: Options.notePos,
					duration: Options.duration,
					alter: Options.alter,
					dotted: Options.dotted,
					elem: AddNoteElement(pos, Options)
				});

				// Shifting note elements
				for (var i = pos + 1; i < Notes.length; i++) {
					ShiftNoteElement(Notes[i].elem, 1);
				};

				// Shifting lyrics elements
				for (var i = Lyrics.length; i >= pos; i--) {
					// Copying array element
					if (Lyrics[i] != null) {
						Lyrics[i+1] = {
							elem: Lyrics[i].elem,
							value: Lyrics[i].value
						};
						Lyrics[i] = null;
						ShiftLyricsElement(i+1, 1);
					}
				}

				// Shifting tabs elements
				for (var i = Tabs.length; i >= pos; i--) {
					// Copying array element
					if (Tabs[i] != null) {
						Tabs[i+1] = {
							value: Tabs[i].value
						};
						Tabs[i] = null;
					}
				}

				ResizeLyricsBar();
			}
			
			function DeleteNote(pos) {
				if (pos == null) {
					return;
				}
				
				if ((pos >= Notes.length)||(pos < 0)) {
					return;
				}
				
				DeleteNoteElement(Notes[pos].elem);
				Notes.splice(pos, 1);
				
				// Shifting note elements
				for (var i = pos; i < Notes.length; i++) {
					ShiftNoteElement(Notes[i].elem, -1);
				};

				// Deleting lyrics element if exists
				if (Lyrics[pos] != null) {
					DeleteLyricsElement(pos);
				}

				// Shifting lyrics elements
				for (var i = pos + 1; i < Lyrics.length; i++) {
					// Copying array element
					if (Lyrics[i] != null) {
						Lyrics[i-1] = {
							elem: Lyrics[i].elem,
							value: Lyrics[i].value
						};
						Lyrics[i] = null;
						ShiftLyricsElement(i-1, -1);
					}
				}

				// Shifting tabs elements
				for (var i = pos + 1; i < Tabs.length; i++) {
					// Copying array element
					if (Tabs[i] != null) {
						Tabs[i-1] = {
							value: Tabs[i].value
						};
						Tabs[i] = null;
					}
				}

				ResizeLyricsBar();
			}

			function ProcessNoteElement(noteIndex) {
				// Y
				var NewY = C0Y - Notes[noteIndex].staffSteps*HalfToneY;
				Notes[noteIndex].elem.css('top', NewY+'px');
				
				// Alteration
				Notes[noteIndex].elem.removeClass('sharp');
				Notes[noteIndex].elem.removeClass('bemol');
				Notes[noteIndex].elem.addClass(Notes[noteIndex].alter);
			}
			
			// Transposes melody. tv -- transposition value.
			function TransposeMelody(tv) {
				if (tv != 0) {
					for (var i = 0; i < Notes.length; i++) {
						if (Notes[i].elementType == 'note') {
							var newNoteID = GetNoteID(Notes[i]) + tv;
							$.extend(Notes[i], GetNoteByID(newNoteID));
							
							var newNote = GetNoteByID(newNoteID);
							Notes[i].notePos = newNote.notePos;
							Notes[i].octave = newNote.octave;
							Notes[i].staffSteps = newNote.staffSteps;
							Notes[i].alter = newNote.alter;
							
							ProcessNoteElement(i);
							ProcessNoteDisplaying(Notes[i].elem, Notes[i].staffSteps);
						}
					};
				}
			}
			
			function CursorOn() {
				Cursor.addClass('on');
			}
			
			function CursorOff() {
				// Cursor.removeClass('on');
			}
			
			function GetCursorPosition() {
				return parseInt(Cursor.find('input[name="position"]').eq(0).val());
			}
			
			function SetCursorPosition(pos) {
				var cursorX = CursorLeft0 + CursorInterval*pos;
				Cursor.find('input[name="position"]').eq(0).val(pos);
				Cursor.css('left', cursorX+'px');
			}
			
			function AddNoteAtCursor(options) {
				var cursorPosition = GetCursorPosition();
				CursorOn();
				AddNote(cursorPosition, options);
				SetCursorPosition(cursorPosition+1);
			}
			
			function DeleteSelectedNote() {
				var CurNote = GetSelectedNote();
				if (CurNote['index'] !== null) {
					DeleteNote(CurNote['index']);
				}
			}

			function DeleteNoteAtCursor() {
				var cursorPosition = GetCursorPosition();
				DeleteNote(cursorPosition);
				SetCursorPosition(cursorPosition);
			}

			function DeleteNoteBeforeCursor() {
				var cursorPosition = GetCursorPosition();
				if (cursorPosition > 0) {
					DeleteNote(cursorPosition-1);
					SetCursorPosition(cursorPosition-1);
				}
			}

			// Array with notes
			var Notes = [];
			// Array with lyrics
			var Lyrics = [];
			// Array with tabs
			var Tabs = [];

			// Returns melody object
			function GetMelodyObject() {
				var Ret = {
					"meta": {},
					"notes": []
				};
				for (var i = 0; i < Notes.length; i++) {
					Ret["notes"].push({});
					Ret["notes"][i]['element_type'] = Notes[i].elementType;
					Ret["notes"][i]['octave'] = Notes[i].octave;
					Ret["notes"][i]['staffSteps'] = Notes[i].staffSteps;
					Ret["notes"][i]['notePos'] = Notes[i].notePos;
					Ret["notes"][i]['duration'] = Notes[i].duration;
					Ret["notes"][i]['alter'] = Notes[i].alter;
					Ret["notes"][i]['dotted'] = Notes[i].dotted;
					Ret["notes"][i]['note_id'] = GetNoteID(Notes[i]);
					Ret["notes"][i]['lyrics'] = '';
					Ret["notes"][i]['tabs'] = '';
					
					if (Lyrics[i] != null) {
						Ret["notes"][i]['lyrics'] = Lyrics[i].value;
					}
					if (Tabs[i] != null) {
						Ret["notes"][i]['tabs'] = Tabs[i].value;
					}
				}
				return Ret;
			}
			
			// Returns note in abc notation
			function GetNoteABC(note, isFlat) {
				var NoteStr = '';
				
				if (note.elementType == 'note') {
					// Alteration
					if (note.alter == 'sharp') {
						NoteStr = NoteStr + '^';
					}
					else if (note.alter == 'bemol') {
						NoteStr = NoteStr + '_';
					}
					else if (isFlat) {
						NoteStr = NoteStr + '=';
					}

					
					// Note letter
					var NoteLetter = {
						0: 'C',
						1: 'D',
						2: 'E',
						3: 'F',
						4: 'G',
						5: 'A',
						6: 'B'
					};
					NoteStr = NoteStr + NoteLetter[note.notePos];
					
					// Octave
					if (note.octave > 0) {
						for (var j = 0; j < note.octave; j++) {
							NoteStr = NoteStr + "'";
						}
					}
					else if (note.octave < 0) {
						for (var j = 0; j < -note.octave; j++) {
							NoteStr = NoteStr + ",";
						}
					}
				}
				else if (note.elementType == 'rest') {
					NoteStr = NoteStr + 'z';
				}
				
				// Note duration
				if (note.dotted) {
					NoteStr = NoteStr + '3/' + note.duration*2;
				}
				else {
					NoteStr = NoteStr + '/' + note.duration;
				}
				
				return NoteStr;
			}
			
			// Returns lyrics element in abc notation
			function GetLyricABC(lyricElem) {
				if (lyricElem == null) {
					return '~ ';
				}
				if (lyricElem.value == '') {
					return '~ ';
				}
				return lyricElem.value.replace(/ /g, '~');
			}

			// Chooses note symbol (4th, 8th etc.) and dot presence by note duration (e.g. 0.125 is a 8th note).
			function ChooseNoteDuration(note_duration) {
				// This function is to be rewritten.

				var possibleChoices = [
					{duration: 0.031250, note_duration: 32, dotted: false},
					{duration: 0.046875, note_duration: 32, dotted: true},
					{duration: 0.062500, note_duration: 16, dotted: false},
					{duration: 0.093750, note_duration: 16, dotted: true},
					{duration: 0.125000, note_duration: 8, dotted: false},
					{duration: 0.187500, note_duration: 8, dotted: true},
					{duration: 0.250000, note_duration: 4, dotted: false},
					{duration: 0.375000, note_duration: 4, dotted: true},
					{duration: 0.500000, note_duration: 2, dotted: false},
					{duration: 0.750000, note_duration: 2, dotted: true},
					{duration: 1.000000, note_duration: 1, dotted: false},
					{duration: 1.500000, note_duration: 1, dotted: true}
				];

				if (note_duration < possibleChoices[0]['duration']) {
					return possibleChoices[0];
				}
				else if (note_duration > possibleChoices[possibleChoices.length - 1]['duration']) {
					return possibleChoices[possibleChoices.length - 1];
				}
				else {
					for (var i = 0; i < possibleChoices.length; i++) {
						if (note_duration == possibleChoices[i]['duration']) {
							return possibleChoices[i];
						}
						else if (note_duration < possibleChoices[i]['duration']) {
							if (note_duration < (possibleChoices[i]['duration'] + possibleChoices[i-1]['duration'])/2) {
								return possibleChoices[i-1];
							}
							else {
								return possibleChoices[i];
							}
						}
					}
				}
			}
			
			// Clears everything
			function ClearEditor() {
				for (var i = 0; i < Notes.length; i++) {
					Notes[i].elem.remove();
					if (Lyrics[i] != null) {
						if (Lyrics[i].elem != null) {
							Lyrics[i].elem.remove();
						}
					}
				}
				
				// Cleaning notes, lyrics and tabs
				while (Notes.length > 0) {
					Notes.pop();
				}
				while (Lyrics.length > 0) {
					Lyrics.pop();
				}
				while (Tabs.length > 0) {
					Tabs.pop();
				}
				
				SetCursorPosition(0);
			}
			
			var methods = {
				// Returns melody object
				getMelodyObject: function() {
					return GetMelodyObject();
				},
				
				// Returns melody object in JSON format
				getJSON: function() {
					return JSON.stringify(GetMelodyObject());
				},
				
				// Returns melody in abc notation (visit http://abcnotation.com/ for more information)
				getABC: function() {
					var Ret = ''
						+ 'X: 1\n'
						+ 'M: 8/8\n'
						+ 'L: 1/1\n'
						+ 'K: Cmaj\n'
					;
					
					// Splitting melody into lines 16 notes each
					var NotesLine = '';
					var LyricsLine ='';
					var TabsLine ='';
					var notesCount = 0;

					// For saving alterations
					var alterations = {};

					for (var i = 0; i < Notes.length; i++) {
						var isFlat = false;
						if (Notes[i].elementType == 'note') {
							// Saving alteration
							if (Notes[i].alter != "") {
								alterations[Notes[i].notePos + ' : ' + Notes[i].octave] = Notes[i].alter;
							}
							// Adding 'flat'
							else if (alterations[Notes[i].notePos + ' : ' + Notes[i].octave]) {
								isFlat = true;
								delete alterations[Notes[i].notePos + ' : ' + Notes[i].octave];
							}
						}

						var NoteStr = GetNoteABC(Notes[i], isFlat);

						NotesLine = NotesLine + NoteStr + ' ';
						if (Notes[i].elementType == 'note') {
							LyricsLine = LyricsLine + GetLyricABC(Lyrics[i]) + ' ';
							TabsLine = TabsLine + GetLyricABC(Tabs[i]) + ' ';
						}
						
						notesCount = notesCount + 1;
						
						if (notesCount >= 16) {
							Ret = Ret + NotesLine + '\n';
							Ret = Ret + 'w: ' + LyricsLine + '\n';
							Ret = Ret + 'w: ' + TabsLine + '\n';
							var NotesLine = '';
							var LyricsLine ='';
							var TabsLine ='';
							notesCount = 0;
						}
					}
					
					if ((NotesLine != '') || (LyricsLine) || (TabsLine)) {
						Ret = Ret + NotesLine + '\n';
						Ret = Ret + 'w: ' + LyricsLine + '\n';
						Ret = Ret + 'w: ' + TabsLine + '\n';
					}
					
					return Ret;
				},
				
				// Imports melody from JSON
				importFromJSONString: function(jsonStr) {
					try {
						var obj = JSON.parse(jsonStr);

						ClearEditor();
						
						for (var i = 0; i < obj['notes'].length; i++) {
							var noteObj = {};
							
							if (obj['notes'][i]['element_type'] == 'note') {
								var note = GetNoteByID(obj['notes'][i]['note_id']);

								noteObj['elementType'] = 'note';
								noteObj['octave'] = note['octave'];
								noteObj['staffSteps'] = note['staffSteps'];
								noteObj['notePos'] = note['notePos'];

								if ((obj['notes'][i]['duration'] != null) && (obj['notes'][i]['dotted'] != null)) {
									noteObj['duration'] = obj['notes'][i]['duration'];
									noteObj['dotted'] = obj['notes'][i]['dotted'];
								}
								else {
									var noteDurationObj = ChooseNoteDuration(obj['notes'][i]['duration_float']);
									noteObj['duration'] = noteDurationObj['note_duration'];
									noteObj['dotted'] = noteDurationObj['dotted'];
								}

								noteObj['alter'] = note['alter'];
								noteObj['note_id'] = obj['notes'][i]['note_id'];
								noteObj['lyrics'] = '';
								AddNote(i, noteObj);
								
								if (obj['notes'][i]['lyrics'] != null) {
									SetLyricElementText(i, obj['notes'][i]['lyrics']);
								}

								if (obj['notes'][i]['tabs'] != null) {
									SetTabElementText(i, obj['notes'][i]['tabs']);
								}
							}
							else if (obj['notes'][i]['element_type'] == 'rest') {
								if ((obj['notes'][i]['duration'] != null) && (obj['notes'][i]['dotted'] != null)) {
									noteObj['duration'] = obj['notes'][i]['duration'];
									noteObj['dotted'] = obj['notes'][i]['dotted'];
								}
								else {
									var noteDurationObj = ChooseNoteDuration(obj['notes'][i]['duration_float']);
									noteObj['duration'] = noteDurationObj['note_duration'];
									noteObj['dotted'] = noteDurationObj['dotted'];
								}
								noteObj['elementType'] = 'rest';
								AddNote(i, noteObj);
								
								if (obj['notes'][i]['lyrics'] != null) {
									SetLyricElementText(i, obj['notes'][i]['lyrics']);
								}
							}
						}
						return true;
					}
					catch (e) {
						return false;
					}
				}
			};
			
			$.fn.func = function(method, params) {
				if (methods[method]) {
					return methods[method](params);
				}
			}
			
			// Creating note sheet and cursor
			var Notesheet = $('<div></div>');
			var Cursor = $('<div class="cursor"><input type="hidden" name="position" value="0"/></div>');
			Notesheet.append(Cursor);

			// Creating lyrics element
			var LyricsBar = $(''
				+'<div class="lyrics">'
					+'<div class="caption">'
						+'<span>'+langMsgs['lyrics']+':</span>'
					+'</div>'
				+'</div>'
				);
			Notesheet.append(LyricsBar);

			// Creating toolbar
			var Toolbar = $(''
				+ '<div class="toolbar">'
					+ '<div class="panel">'
						+ '<button class="delete_note_left" title="'+langMsgs['deleteButtonTitleLeft']+'"></button>'
						+ '<button class="delete_note" title="'+langMsgs['deleteButtonTitle']+'"></button>'
						+ '<button class="delete_note_right" title="'+langMsgs['deleteButtonTitleRight']+'"></button>'
						+ '<button class="add_note add_note_1" title="'+langMsgs['insertNote']+'"></button>'
						+ '<button class="add_note add_note_2" title="'+langMsgs['insertNote']+'"></button>'
						+ '<button class="add_note add_note_4" title="'+langMsgs['insertNote']+'"></button>'
						+ '<button class="add_note add_note_8" title="'+langMsgs['insertNote']+'"></button>'
						+ '<button class="add_note add_note_16" title="'+langMsgs['insertNote']+'"></button>'
						+ '<button class="add_note add_note_32" title="'+langMsgs['insertNote']+'"></button>'
						+ '<button class="add_note add_rest_1" title="'+langMsgs['insertRest']+'"></button>'
						+ '<button class="add_note add_rest_2" title="'+langMsgs['insertRest']+'"></button>'
						+ '<button class="add_note add_rest_4" title="'+langMsgs['insertRest']+'"></button>'
						+ '<button class="add_note add_rest_8" title="'+langMsgs['insertRest']+'"></button>'
						+ '<button class="add_note add_rest_16" title="'+langMsgs['insertRest']+'"></button>'
						+ '<button class="add_note add_rest_32" title="'+langMsgs['insertRest']+'"></button>'
					+ '</div>'
					+ '<div class="panel note_attributes">'
						+ '<label class="checkbox_button"><input name="bemol" type="checkbox"/><div class="button bemol" title="'+langMsgs['onOffFlat']+'"></div></label>'
						+ '<label class="checkbox_button"><input name="sharp" type="checkbox"/><div class="button sharp" title="'+langMsgs['onOffSharp']+'"></div></label>'
						+ '<label class="checkbox_button"><input name="dotted" type="checkbox"/><div class="button dot" title="'+langMsgs['onOffDotted']+'"></div></label>'
					+ '</div>'
					+ '<div class="panel transposition_panel">'
						+ '<button class="transpose_up" title="'+langMsgs['transposeUp']+'"></button>'
						+ '<button class="transpose_down" title="'+langMsgs['transposeDown']+'"></button>'
					+ '</div>'
					+ '<div class="clear"></div>'
				+ '</div>'
				);
			Notesheet.append('<div class="clef treble"></div>');
			$(this).append(Notesheet);
			$(this).append(Toolbar);

			$(this).addClass('noteeditor');
			Notesheet.addClass('notesheet');

			SetCursorPosition(Notes.length);
			CursorOn();
			DisableNoteAttributesToolbar();
			
			function GetCursorPositionByEvent(e, elem) {
				if (elem == null) {
					elem = Notesheet;
				}

				// Getting mouse coordinates:
				// Note sheet coordinates
				var notesheetPos = Notesheet.offset();
				// Mouse coordinates
				var mousePos = {
					x: e.pageX - notesheetPos.left + elem.scrollLeft(),
					y: e.pageY - notesheetPos.top
				};
				
				var newCursorPosition = Math.round((mousePos.x - CursorLeft0)/CursorInterval);
				if (newCursorPosition < 0) {
					newCursorPosition = 0;
				}
				else if (newCursorPosition > Notes.length) {
					newCursorPosition = Notes.length;
				}
				
				return newCursorPosition;
			}
			
			function AddLyricElement(index, text) {
				if (text == null) {
					text = '';
				}
				var LyricElem = $('<span class="lyric">'+text+'</span>');
				var newX = LyricsLeft0 + index*CursorInterval;
				LyricElem.css('left', newX+'px');
				LyricsBar.append(LyricElem);
				return LyricElem;
			}
			
			function SetLyricElementText(index, text) {
				if (Lyrics[index] == null) {
					Lyrics[index] = {
						elem: AddLyricElement(index, text),
						value: text
					};
				}
				else {
					Lyrics[index].value = text;
					Lyrics[index].elem.text(text);
				}
			}
			
			function SetTabElementText(index, text) {
				if (Tabs[index] == null) {
					Tabs[index] = {
						value: text
					};
				}
				else {
					Tabs[index].value = text;
				}
			}
			
			function ShowLyricsEdit(index) {
				if (index < 0) {
					index = 0;
				}
				
				var LyricElem = $('<input type="text"/>');
				var newX = LyricsLeft0 + index*CursorInterval;
				LyricElem.css('left', newX+'px');
				
				if (Lyrics[index] != null) {
					LyricElem.val(Lyrics[index].value);
				}
				
				LyricsBar.append(LyricElem);
				
				// Binding events
				LyricElem.click(function(e) {
					e.stopPropagation();
				});
				LyricElem.focusout(function() {
					var LyricText = $(this).val();
					SetLyricElementText(index, LyricText);
					$(this).remove();
				});
				
				LyricElem.focus();
			}

			Notesheet.click(function(e) {
				DeselectAllNotes();
				DisableNoteAttributesToolbar();
				
				var cursorPosition = GetCursorPositionByEvent(e);
				
				SetCursorPosition(cursorPosition);
				CursorOn();
			});

			LyricsBar.click(function(e) {
				if (Notes.length > 0) {
					var cursorPosition = GetCursorPositionByEvent(e);
					ShowLyricsEdit(cursorPosition - 1);
				}
				e.stopPropagation();
			});
			
			// "Add note" buttons
			Toolbar.find('button.add_note_1').click(function() {
				AddNoteAtCursor({duration: 1});
				return false;
			});
			Toolbar.find('button.add_note_2').click(function() {
				AddNoteAtCursor({duration: 2});
				return false;
			});
			Toolbar.find('button.add_note_4').click(function() {
				AddNoteAtCursor({duration: 4});
				return false;
			});
			Toolbar.find('button.add_note_8').click(function() {
				AddNoteAtCursor({duration: 8});
				return false;
			});
			Toolbar.find('button.add_note_16').click(function() {
				AddNoteAtCursor({duration: 16});
				return false;
			});
			Toolbar.find('button.add_note_32').click(function() {
				AddNoteAtCursor({duration: 32});
				return false;
			});
			
			// "Add rest" buttons
			Toolbar.find('button.add_rest_1').click(function() {
				AddNoteAtCursor({elementType: 'rest', duration: 1});
				return false;
			});
			Toolbar.find('button.add_rest_2').click(function() {
				AddNoteAtCursor({elementType: 'rest', duration: 2});
				return false;
			});
			Toolbar.find('button.add_rest_4').click(function() {
				AddNoteAtCursor({elementType: 'rest', duration: 4});
				return false;
			});
			Toolbar.find('button.add_rest_8').click(function() {
				AddNoteAtCursor({elementType: 'rest', duration: 8});
				return false;
			});
			Toolbar.find('button.add_rest_16').click(function() {
				AddNoteAtCursor({elementType: 'rest', duration: 16});
				return false;
			});
			Toolbar.find('button.add_rest_32').click(function() {
				AddNoteAtCursor({elementType: 'rest', duration: 32});
				return false;
			});
			
			// "Delete note" button
			Toolbar.find('button.delete_note').click(function() {
				DeleteSelectedNote();
				return false;
			});
			
			// "Delete note on the right" button
			Toolbar.find('button.delete_note_right').click(function() {
				DeleteNoteAtCursor();
				return false;
			});
			
			// "Delete note on the left" button
			Toolbar.find('button.delete_note_left').click(function() {
				DeleteNoteBeforeCursor();
				return false;
			});
			
			// ---------------------------------------------
			// Note attributres toolbar actions
			// ---------------------------------------------
			
			// bemol checkbox
			var cbBemol = Toolbar.find('.note_attributes input[type="checkbox"][name="bemol"]').eq(0);
			// sharp checkbox
			var cbSharp = Toolbar.find('.note_attributes input[type="checkbox"][name="sharp"]').eq(0);
			// dotted checkbox
			var cbDotted = Toolbar.find('.note_attributes input[type="checkbox"][name="dotted"]').eq(0);
			
			// Bemol checkbox
			cbBemol.change(function() {
				var CurNote = GetSelectedNote();
				if ($(this).prop('checked')) {
					CurNote.elem.removeClass('sharp');
					CurNote.elem.addClass('bemol');
					Notes[CurNote.index].alter = 'bemol';
				}
				else {
					CurNote.elem.removeClass('bemol');
					Notes[CurNote.index].alter = '';
				}
				LoadNotePropertiesToToolbar(CurNote.elem);
			});
			
			// Sharp checkbox
			cbSharp.change(function() {
				var CurNote = GetSelectedNote();
				if ($(this).prop('checked')) {
					CurNote.elem.removeClass('bemol');
					CurNote.elem.addClass('sharp');
					Notes[CurNote.index].alter = 'sharp';
				}
				else {
					CurNote.elem.removeClass('sharp');
					Notes[CurNote.index].alter = '';
				}
				LoadNotePropertiesToToolbar(CurNote.elem);
			});
			
			// Dotted checkbox
			cbDotted.change(function() {
				var CurNote = GetSelectedNote();
				if ($(this).prop('checked')) {
					CurNote.elem.addClass('dotted');
					Notes[CurNote.index].dotted = true;
				}
				else {
					CurNote.elem.removeClass('dotted');
					Notes[CurNote.index].dotted = false;
				}
				LoadNotePropertiesToToolbar(CurNote.elem);
			});

			// ---------------------------------------------
			// Transpositions
			// ---------------------------------------------
			
			// Transpose melody buttons
			Toolbar.find('button.transpose_up').click(function() {
				TransposeMelody(1);
				return false;
			});
			Toolbar.find('button.transpose_down').click(function() {
				TransposeMelody(-1);
				return false;
			});
			
		});		
	}
}) (jQuery);
