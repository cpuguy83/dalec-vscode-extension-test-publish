import * as vscode from 'vscode';
import * as YAML from 'yaml';
import { DalecDocumentTracker } from '../dalecDocumentTracker';

export interface DalecSpecMetadata {
  name?: string;
  version?: string;
}

/**
 * Extracts name and version from a Dalec spec file
 */
export async function extractDalecSpecMetadata(document: vscode.TextDocument): Promise<DalecSpecMetadata> {
  try {
    const content = document.getText();
    const parsed = YAML.parse(content);
    
    return {
      name: typeof parsed?.name === 'string' ? parsed.name : undefined,
      version: typeof parsed?.version === 'string' ? parsed.version : undefined,
    };
  } catch (error) {
    console.error('Failed to parse Dalec spec:', error);
    return {};
  }
}

export async function resolveDalecDocument(
  uri: vscode.Uri | undefined,
  tracker: DalecDocumentTracker,
): Promise<vscode.TextDocument | undefined> {
  if (uri) {
    const doc = await vscode.workspace.openTextDocument(uri);
    if (tracker.isDalecDocument(doc)) {
      return doc;
    }
    void vscode.window.showErrorMessage('Selected file is not recognized as a Dalec spec.');
    return undefined;
  }

  const activeDoc = vscode.window.activeTextEditor?.document;
  if (activeDoc && tracker.isDalecDocument(activeDoc)) {
    return activeDoc;
  }

  void vscode.window.showErrorMessage('Open a Dalec spec (first line must start with #syntax=...) to continue.');
  return undefined;
}

export async function isValidDalecDoc(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const doc = editor.document;

  // Only allow YAML files
  if (doc.languageId !== "yaml") {
    vscode.window.showWarningMessage("Dalec can only run on YAML files.");
    return;
  }

  const firstLine = doc.lineAt(0).text.trim();

  const isDalec =
    firstLine.startsWith('# syntax=ghcr.io/project-dalec/dalec/frontend:latest') ||
    (firstLine.startsWith('#') && firstLine.includes('-dalec')) ||
    (firstLine.startsWith('#') && firstLine.includes('/dalec/'));

  if (!isDalec) {
    vscode.window.showInformationMessage(
      "This YAML file is not a Dalec file (missing Dalec syntax header)."
    );
    return;
  }
}
