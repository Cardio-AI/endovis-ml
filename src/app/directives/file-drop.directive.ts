import {Directive, HostBinding, HostListener} from '@angular/core';

@Directive({
  selector: '[appFileDrop]'
})
export class FileDropDirective {

  @HostBinding('class.upload-dialog-form-files-dragging') active = false;

  constructor() { }

  @HostListener('click', ['$event']) click(e: MouseEvent) {
    // this.el.nativeElement.innerHTML.
  }

  @HostListener('dragenter', ['$event']) onDragEnter(e: DragEvent) {
    e.preventDefault();
    this.active = true;
  }

  @HostListener('dragover', ['$event']) onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  @HostListener('dragleave', ['$event']) onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.active = false;
  }


  @HostListener('drop', ['$event']) onDrop(e: DragEvent) {
    e.preventDefault();
    this.active = false;
  }

  // (dragenter)="dragenter($event)" (dragover)="dragover($event)" (dragleave)="dragleave($event)" (drop)="drop($event)"

}
