import {Directive, EventEmitter, HostBinding, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[appFileDrop]'
})
export class FileDropDirective {

  @HostBinding('class.upload-dialog-form-files-dragging') active = false;
  @Output() dataSelected: EventEmitter<FileList> = new EventEmitter<FileList>();

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

    let selectedFiles = e.dataTransfer?.files;

    console.log(selectedFiles)
    this.active = false;
  }
}
