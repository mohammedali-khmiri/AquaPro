import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-ip-camera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ip-camera.component.html',
  styleUrl: './ip-camera.component.css'
})
export class IpCameraComponent implements OnDestroy {
  @ViewChild('streamImg') streamImg!: ElementRef<HTMLImageElement>;
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  streamUrl = '';
  inputUrl = '';
  isConnected = false;
  isFullscreen = false;
  streamType: 'mjpeg' | 'hls' = 'mjpeg';
  connectionError = false;
  isLoading = false;

  safeUrl: SafeResourceUrl | null = null;

  constructor(
    public layoutSvc: LayoutService,
    private sanitizer: DomSanitizer
  ) {}

  connect(): void {
    if (!this.inputUrl.trim()) return;

    let url = this.inputUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    this.connectionError = false;
    this.isLoading = true;
    this.streamUrl = url;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    // Detect stream type from URL
    this.streamType = url.endsWith('.m3u8') ? 'hls' : 'mjpeg';
    this.isConnected = true;
  }

  disconnect(): void {
    this.isConnected = false;
    this.streamUrl = '';
    this.safeUrl = null;
    this.connectionError = false;
    this.isLoading = false;
  }

  onStreamLoaded(): void {
    this.isLoading = false;
    this.connectionError = false;
  }

  onStreamError(): void {
    this.isLoading = false;
    this.connectionError = true;
  }

  toggleFullscreen(): void {
    const el = document.getElementById('stream-container');
    if (!document.fullscreenElement) {
      el?.requestFullscreen();
      this.isFullscreen = true;
    } else {
      document.exitFullscreen();
      this.isFullscreen = false;
    }
  }

  setQuickUrl(preset: string): void {
    this.inputUrl = preset;
  }

  ngOnDestroy(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
}
