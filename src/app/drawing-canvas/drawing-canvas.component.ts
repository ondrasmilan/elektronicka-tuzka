import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { pairwise, switchMap, takeUntil } from 'rxjs/operators';
import { FileUploadService } from '../file-upload.service';
import { FormBuilder } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-drawing-canvas',
  templateUrl: './drawing-canvas.component.html',
  styleUrls: ['./drawing-canvas.component.scss'],
})
export class DrawingCanvasComponent implements AfterViewInit, OnDestroy {
  title = 'Elektronická tužka';
  @ViewChild('canvas', { static: true })
  canvas: ElementRef | undefined;
  @ViewChild('bottom', { static: true })
  bottom: ElementRef | undefined;
  @ViewChild('button', { static: true })
  button: ElementRef | undefined;
  @ViewChild('main', { static: true })
  main: ElementRef | undefined;
  @ViewChild('h1', { static: true })
  h1: ElementRef | undefined;
  @ViewChild('inputName', { static: true })
  inputName: ElementRef | undefined;
  strokeStyle: string = 'red';
  image = new Image();
  imageLoaded: boolean = false;
  file: File = new File([], '');
  destURL: string = '';
  fileName: string = '';
  loadFileForm = this.formBuilder.group({
    file: File,
  });
  outerEl: HTMLElement | null | undefined = null;
  uploaded: boolean = false;

  private cx!: CanvasRenderingContext2D | null | undefined;
  drawingSubscription!: Subscription;

  constructor(
    private fileUploadService: FileUploadService,
    private formBuilder: FormBuilder
  ) {}
  onChangeUrl(event: any) {
    if (this.uploaded) {
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
    }
    this.destURL = event.target.value;
    //console.log(this.destURL);
  }
  onChangeName(event: any) {
    if (this.uploaded) {
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
    }
    this.fileName = event.target.value;
    //console.log(this.fileName);
  }
  onUpload() {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    const buttonEl: HTMLButtonElement = this.button?.nativeElement;
    let file: File;
    canvasEl.toBlob((blob) => {
      if (blob) file = new File([blob], this.fileName);
      else throw 'No image';
      //console.log(file);
      var res = this.fileUploadService
        .upload(file, this.destURL)
        .subscribe((event: any) => {
          buttonEl.classList.replace('btn-primary', 'btn-success');
          //console.log(event);
        });
      //console.log(res);
    });
  }
  onLoad(imageInput: any) {
    if (this.uploaded) {
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
    }
    const inputNameEl: HTMLInputElement = this.inputName?.nativeElement;
    this.imageLoaded = false;
    this.resizeComponent();
    const bottomEl: HTMLElement = this.bottom?.nativeElement;
    this.file = imageInput.files[0];
    inputNameEl.value = this.file.name;
    this.fileName = this.file.name;
    const reader = new FileReader();
    const im = this.image;
    reader.addEventListener(
      'load',
      () => {
        // convert image file to base64 string
        im.src = reader.result as string;
      },
      false
    );
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    this.cx = canvasEl.getContext('2d');
    if (this.file) {
      //console.log(this.file);
      reader.readAsDataURL(this.file);
    }
    this.image.onload = () => {
      console.log('image has loaded!');

      canvasEl.classList.remove('beforeImg');
      this.imageLoaded = true;

      canvasEl.width = this.image.width;
      canvasEl.height = this.image.height;
      this.cx!.drawImage(this.image, 0, 0, canvasEl.width, canvasEl.height);
      canvasEl.style.marginBottom = bottomEl.offsetHeight.toString() + 'px';
    };
  }
  ngAfterViewInit() {
    // get the context
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    this.cx = canvasEl.getContext('2d');

    this.resizeComponent();
    if (!this.cx) throw 'Cannot get context';
    // set some default properties about the line
    this.cx.lineWidth = 4;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = this.strokeStyle;

    this.resizeComponent();

    this.outerEl = this.main?.nativeElement.parentElement?.parentElement;
    this.captureEvents(canvasEl);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      this.resizeComponent();
    });
    if (this.outerEl) {
      observer.observe(this.outerEl);
    }
  }

  resizeComponent(event?: Event) {
    const canvasEl: HTMLCanvasElement = this.canvas?.nativeElement;
    const bottomEl: HTMLButtonElement = this.bottom?.nativeElement;
    const outerEl: HTMLElement | null | undefined =
      this.main?.nativeElement.parentElement?.parentElement;
    if (!this.imageLoaded) {
      if (outerEl) {
        canvasEl.height = outerEl.offsetHeight - (bottomEl.offsetHeight + 10);
        canvasEl.width = outerEl.offsetWidth;
      }
      this.cx = canvasEl.getContext('2d');
    } else {
      canvasEl.style.marginBottom = bottomEl.offsetHeight.toString() + 'px';
    }
  }
  captureEvents(canvasEl: HTMLCanvasElement) {
    // this will capture all mousedown events from teh canvas element
    this.drawingSubscription = fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          // after a mouse down, we'll record all mouse moves
          return fromEvent(canvasEl, 'mousemove').pipe(
            // we'll stop (and unsubscribe) once the user releases the mouse
            // this will trigger a 'mouseup' event
            takeUntil(fromEvent(canvasEl, 'mouseup')),
            // we'll also stop (and unsubscribe) once the mouse leaves the canvas (mouseleave event)
            takeUntil(fromEvent(canvasEl, 'mouseleave')),
            // pairwise lets us get the previous value to draw a line from
            // the previous point to the current point
            pairwise()
          );
        })
      )
      .subscribe((res) => {
        const rect = canvasEl.getBoundingClientRect();

        const prevMouseEvent = res[0] as MouseEvent;
        const currMouseEvent = res[1] as MouseEvent;

        // previous and current position with the offset
        const prevPos = {
          x: prevMouseEvent.clientX - rect.left,
          y: prevMouseEvent.clientY - rect.top,
        };

        const currentPos = {
          x: currMouseEvent.clientX - rect.left,
          y: currMouseEvent.clientY - rect.top,
        };

        // this method we'll implement soon to do the actual drawing
        this.drawOnCanvas(prevPos, currentPos);
      });
  }
  drawOnCanvas(
    prevPos: { x: number; y: number },
    currentPos: { x: number; y: number }
  ) {
    if (this.uploaded) {
      const buttonEl: HTMLButtonElement = this.button?.nativeElement;
      buttonEl.classList.replace('btn-success', 'btn-primary');
    }
    // incase the context is not set
    if (!this.cx) {
      return;
    }

    // start our drawing path
    this.cx.beginPath();

    this.cx.strokeStyle = this.strokeStyle;
    this.cx.lineWidth = 5;
    // we're drawing lines so we need a previous position
    if (prevPos) {
      // sets the start point
      this.cx.moveTo(prevPos.x, prevPos.y); // from
      // draws a line from the start pos until the current position
      this.cx.lineTo(currentPos.x, currentPos.y);

      // strokes the current path with the styles we set earlier
      this.cx.stroke();
    }
  }

  ngOnDestroy() {
    // this will remove event lister when this component is destroyed
    this.drawingSubscription.unsubscribe();
  }
}
