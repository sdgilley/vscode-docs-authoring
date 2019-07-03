"use strict";

import { QuickPickItem, window } from "vscode";
import { getAsync } from "../helper/http-helper";
import { noActiveEditorMessage, isMarkdownFileCheck, insertContentToEditor, setCursorPosition, sendTelemetryData } from "../helper/common";
import { reporter } from "../helper/telemetry";

const telemetryCommand: string = "applyXref";
const rootUrl: string = "https://xref.docs.microsoft.com";
const tags: string = "/dotnet";

export function applyXrefCommand() {
  const commands = [
    { command: applyXref.name, callback: applyXref },
  ];
  return commands;
}

export async function applyXref() {
  reporter.sendTelemetryEvent(`${telemetryCommand}`);
  let editor = window.activeTextEditor;
  if (!editor) {
    noActiveEditorMessage();
    return;
  } else {
    if (!isMarkdownFileCheck(editor, false)) {
      return;
    }
  }
  let xref = "";
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  // if theres no selected text, add xref syntax as <xref:...>
  let xrefSelection = await getXrefSelection()
  if (xrefSelection) {
    if (selectedText === "") {
      let displayProperty = await getXrefDisplayProperty();
      if (displayProperty && displayProperty.label != "none") {
        xrefSelection.label = `${xrefSelection.label}?displayProperty=${displayProperty.label}`;
      }
      xref = `<xref:${encodeSpecialCharacters(xrefSelection.label)}>`
    } else {
      xref = `[${selectedText}](xref:${xrefSelection.label})`
    }
  }
  insertContentToEditor(editor, applyXref.name, xref, true);
  // Gets the cursor position
  const position = editor.selection.active;
  const positionCharacter = applyXref.name === "applyXref" ? position.character + xref.length : position.character + 1;
  // Makes the cursor position in between syntaxs
  setCursorPosition(editor, position.line, positionCharacter);
  sendTelemetryData(telemetryCommand, "");
}

function encodeSpecialCharacters(content: string) {
  content = content.replace("*", "%2A")
  content = content.replace("#", "%23")
  content = content.replace("`", "%60")
  return content;
}

async function getXrefDisplayProperty() {
  const items: QuickPickItem[] = [];
  items.push({
    description: "None (default)",
    label: "none",
  });
  items.push({
    description: "Name with Type",
    label: "nameWithType",
  });
  items.push({
    description: "Full Name",
    label: "fullName",
  });
  return window.showQuickPick(items, { placeHolder: "Select Display Property" }).then((selection) => {
    if (!selection) {
      return;
    }
    return selection;
  });
}

async function getXrefSelection() {
  const items: QuickPickItem[] = [];
  let uid: string | undefined = await window.showInputBox({ placeHolder: "Enter XREF Search Term" });
  if (uid) {
    let content = await getAsync(`${rootUrl}/autocomplete?tags=${tags}&text=${uid}`);
    content.data.map((item: { tags: any; uid: string; }) => {
      items.push({
        label: item.uid,
      });
    });
    return window.showQuickPick(items, { placeHolder: "Link to XREF" }).then((selection) => {
      if (!selection) {
        return;
      }
      return selection;
    });
  }
} 