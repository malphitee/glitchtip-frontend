import { Component, OnInit, ElementRef, PLATFORM_ID, inject } from "@angular/core";
import { ViewportScroller, isPlatformBrowser } from "@angular/common";
import { MatCard, MatCardContent } from "@angular/material/card";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MarkdownComponent, MarkdownService } from "ngx-markdown";
import { SeoService } from "../shared/seo.service";

/**
 * Placeholder host used throughout the docs' example snippets. When a reader
 * arrives from an in-app "Set up MCP" link, the real instance origin is passed
 * in the URL fragment and swapped in here so the examples are paste-ready.
 */
const INSTANCE_PLACEHOLDER = "https://your-glitchtip.example.com";

@Component({
  imports: [MatCard, MatCardContent, RouterLink, MarkdownComponent],
  templateUrl: "./documentation-page.component.html",
  styleUrls: ["./documentation-page.component.scss"],
})
export class DocumentationPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private markdownService = inject(MarkdownService);
  private viewportScroller = inject(ViewportScroller);
  private seo = inject(SeoService);
  private host = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);

  slug: string | null = null;

  ngOnInit(): void {
    const pageSlug: string = this.route.snapshot.params.slug;
    const locationPrefix = `/documentation/${pageSlug}`;
    this.seo.setPageSeo({
      title: `${this.titleFromSlug(pageSlug)} — Documentation`,
    });

    this.markdownService.renderer.heading = ({ text, depth }) => {
      const escapedText = text
        .toLowerCase()
        // replace non-letter characters with hyphens
        .replace(/[^\w]+/g, "-")
        //trim hyphens at start and end of string
        .replace(/^-+|-+$/g, "");
      return (
        `<h${depth} class="anchor">` +
        `<a id="${escapedText}" href="${locationPrefix}#${escapedText}">` +
        text +
        "</a>" +
        `</h${depth}>`
      );
    };

    this.slug = locationPrefix + ".md";
  }

  onMarkdownReady() {
    this.fillInstancePlaceholder();
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      this.viewportScroller.scrollToAnchor(fragment);
    }
  }

  /**
   * If the URL fragment carries an `instance` origin (e.g.
   * `#instance=https://errors.acme.com`), replace the placeholder host in the
   * rendered example snippets with it. Fragments are read client-side only and
   * never sent to this server, so a self-hoster's instance domain isn't logged
   * here. The value is validated as an http(s) origin and written via
   * textContent, so it can't inject markup.
   */
  private fillInstancePlaceholder(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const fragment = this.route.snapshot.fragment;
    if (!fragment) {
      return;
    }
    const instance = new URLSearchParams(fragment).get("instance");
    if (!instance) {
      return;
    }
    let origin: string;
    try {
      const url = new URL(instance);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return;
      }
      origin = url.origin;
    } catch {
      return;
    }
    const root: HTMLElement | null =
      this.host.nativeElement.querySelector(".markdown-container");
    if (!root) {
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.nodeValue?.includes(INSTANCE_PLACEHOLDER)) {
        node.nodeValue = node.nodeValue.split(INSTANCE_PLACEHOLDER).join(origin);
      }
    }
  }

  private titleFromSlug(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
