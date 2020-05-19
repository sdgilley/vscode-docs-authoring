
import * as assert from "assert";
import Axios from "axios";
import * as chai from "chai";
import * as spies from "chai-spies";
import * as os from "os";
import { resolve } from "path";
import { commands, QuickPickItem, window } from "vscode";
import { applyComplex, applyIcon, applyImage, applyLightbox, applyLocScope, insertImageCommand, pickImageType } from "../../../controllers/image-controller";
import { insertLink, insertLinksAndMediaCommands, insertURL, insertVideo, selectLinkType, selectLinkTypeToolbar, selectMediaType } from "../../../controllers/media-controller";
import * as common from "../../../helper/common";
import * as telemetry from "../../../helper/telemetry";
import { loadDocumentAndGetItReady, sleep, sleepTime } from "../../test.common/common";

chai.use(spies);

// tslint:disable-next-line: no-var-requires
const sinon = require("sinon");

const expect = chai.expect;

suite("Media Controller", () => {
    // Reset and tear down the spies
    teardown(() => {
        chai.spy.restore(common);
    });

    suiteTeardown(async () => {
        await commands.executeCommand("workbench.action.closeAllEditors");
        sinon.restore();
    });

    suiteSetup(() => {
        sinon.stub(telemetry, "sendTelemetryData");
    });
    test("insertLinksAndMediaCommands", () => {
        const controllerCommands = [
            { command: insertVideo.name, callback: insertVideo },
            { command: insertURL.name, callback: insertURL },
            { command: insertLink.name, callback: insertLink },
            { command: selectLinkType.name, callback: selectLinkType },
            { command: selectLinkTypeToolbar.name, callback: selectLinkTypeToolbar },
            { command: selectMediaType.name, callback: selectMediaType },
        ];
        expect(insertLinksAndMediaCommands()).to.deep.equal(controllerCommands);
    });
    test("media controller - noActiveEditorMessage", async () => {
        const spy = chai.spy.on(common, "noActiveEditorMessage");
        insertVideo();
        await sleep(sleepTime);
        expect(spy).to.have.been.called();
    });
    test("insertVideo", async () => {
        const stubShowInputBox = sinon.stub(window, "showInputBox");
        stubShowInputBox.onCall(0).resolves("https://channel9.msdn.com/Series/Youve-Got-Key-Values-A-Redis-Jump-Start/03/player");
        const filePath = resolve(__dirname, "../../../../../src/test/data/repo/articles/media-controller.md");
        await loadDocumentAndGetItReady(filePath);
        insertVideo();
        await sleep(sleepTime);
        const expectedText = `:::video source="https://channel9.msdn.com/Series/Youve-Got-Key-Values-A-Redis-Jump-Start/03/player":::`;
        const editor = window.activeTextEditor;
        const actualText = editor?.document.getText();
        assert.equal(expectedText, actualText);
        stubShowInputBox.restore();
    });
});
