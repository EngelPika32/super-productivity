import { ChangeDetectionStrategy, Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { T } from '../../t.const';
import { Subscription } from 'rxjs';
import { ESCAPE } from '@angular/cdk/keycodes';
import { LS_LAST_FULLSCREEN_EDIT_VIEW_MODE } from '../../core/persistence/ls-keys.const';

type ViewMode = 'SPLIT' | 'PARSED' | 'TEXT_ONLY';
const ALL_VIEW_MODES: ['SPLIT', 'PARSED', 'TEXT_ONLY'] = ['SPLIT', 'PARSED', 'TEXT_ONLY'];

@Component({
  selector: 'dialog-fullscreen-markdown',
  templateUrl: './dialog-fullscreen-markdown.component.html',
  styleUrls: ['./dialog-fullscreen-markdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogFullscreenMarkdownComponent implements OnDestroy {
  T: typeof T = T;
  viewMode: ViewMode = 'SPLIT';

  private _subs: Subscription = new Subscription();

  constructor(
    private _matDialogRef: MatDialogRef<DialogFullscreenMarkdownComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    const lastViewMode = localStorage.getItem(LS_LAST_FULLSCREEN_EDIT_VIEW_MODE);
    if (ALL_VIEW_MODES.includes(lastViewMode as ViewMode)) {
      this.viewMode = lastViewMode as ViewMode;
    }

    // we want to save as default
    _matDialogRef.disableClose = true;
    this._subs.add(
      _matDialogRef.keydownEvents().subscribe((e) => {
        if ((e as any).keyCode === ESCAPE) {
          e.preventDefault();
          this.close();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  close(isSkipSave: boolean = false): void {
    this._matDialogRef.close(isSkipSave || this.data.content);
  }

  onViewModeChange(): void {
    localStorage.setItem(LS_LAST_FULLSCREEN_EDIT_VIEW_MODE, this.viewMode);
  }
}
