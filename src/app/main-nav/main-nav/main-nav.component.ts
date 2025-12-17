import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  WritableSignal,
} from "@angular/core";
import { toObservable, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { MainNavService } from "../main-nav.service";
import { SettingsService } from "src/app/api/settings.service";
import { UserService } from "src/app/api/user/user.service";
import { MobileNavToolbarComponent } from "../../mobile-nav-toolbar/mobile-nav-toolbar.component";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { MatTreeModule } from "@angular/material/tree";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { AuthService } from "src/app/auth.service";
import { OrganizationsService } from "src/app/api/organizations.service";
import { NavigationEnd } from "@angular/router";
import {
  MatSelect,
  MatSelectChange,
  MatSelectModule,
} from "@angular/material/select";

interface NavNode {
  name: string;
  icon?: string;
  route?: string[];
  requiresBilling?: boolean;
  requiresActiveOrg?: boolean;
  children?: NavNode[];
  useExactRoute?: boolean;
}

const MENU_DATA: NavNode[] = [
  {
    name: $localize`Issues`,
    icon: "breaking_news",
    route: ["org_slug", "issues"],
    requiresActiveOrg: true,
  },
  {
    name: $localize`Uptime Monitors`,
    icon: "share_eta",
    route: ["org_slug", "uptime-monitors"],
    requiresActiveOrg: true,
  },
  {
    name: $localize`Performance`,
    icon: "avg_pace",
    route: ["org_slug", "performance"],
    requiresActiveOrg: true,
  },
  {
    name: $localize`Projects`,
    icon: "team_dashboard",
    route: ["org_slug", "projects"],
    requiresActiveOrg: true,
  },
  {
    name: $localize`Releases`,
    icon: "rocket_launch",
    route: ["org_slug", "releases"],
    requiresActiveOrg: true,
  },
];

@Component({
  selector: "gt-main-nav",
  templateUrl: "./main-nav.component.html",
  styleUrls: ["./main-nav.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatTreeModule,
    MatIconModule,
    RouterLink,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLinkActive,
    MatCardModule,
    MobileNavToolbarComponent,
  ],
})
export class MainNavComponent {
  private router = inject(Router);
  private mainNav = inject(MainNavService);
  private organizationsService = inject(OrganizationsService);
  private auth = inject(AuthService);
  private settingsService = inject(SettingsService);
  private userService = inject(UserService);

  currentUrl = signal(this.router.url);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const navEnd = event as NavigationEnd;
        this.currentUrl.set(navEnd.urlAfterRedirects);
      }
    });
  }

  isInOrganizationSection = computed(() =>
    this.currentUrl().includes("/settings"),
  );

  isInProfileSection = computed(() => this.currentUrl().includes("/profile"));

  isCollapsed: WritableSignal<boolean> = signal(false);

  childrenAccessor = (node: NavNode) => node.children ?? [];

  getRouteWithOrgSlug(route: string[]) {
    return route.map((item) =>
      item === "org_slug" ? this.activeOrganizationSlug() : item,
    );
  }

  activeOrganizationSlug = this.organizationsService.activeOrganizationSlug;
  activeOrganization = this.organizationsService.activeOrganization;
  organizations = this.organizationsService.organizations;
  organizationsInitialLoad = this.organizationsService.initialLoad;
  isLoggedIn = this.auth.isAuthenticated;
  navOpen = this.mainNav.navOpen;
  billingEnabled = this.settingsService.billingEnabled;
  paidForGlitchTip = this.settingsService.paidForGlitchTip;
  mobileNav = this.mainNav.mobileNav;
  version = this.settingsService.version;

  contextLoaded = computed(
    () =>
      this.settingsService.initialLoad() &&
      this.organizationsInitialLoad() &&
      !!this.userService.user(),
  );

  canCreateOrg = computed(
    () =>
      this.settingsService.enableOrganizationCreation() ||
      this.userService.user() ||
      this.organizationsService.organizationsCount(),
  );

  menuData = computed(() => {
    const billingEnabled = this.billingEnabled();
    return MENU_DATA.map((node) => {
      if (node.children && !billingEnabled) {
        node.children = node.children.filter((child) => !child.requiresBilling);
      }
      return node;
    });
  });

  menuData$ = toObservable(this.menuData);

  async logout() {
    await this.auth.logout();
    window.location.href = "/login";
  }

  private dispatchResizeEvent() {
    window.dispatchEvent(new Event("resize"));
  }

  toggleSideNav() {
    this.mainNav.getToggleNav();
  }

  toggleCollapse() {
    this.isCollapsed.update((val) => !val);
    this.dispatchResizeEvent();
  }

  closeSideNav() {
    this.mainNav.getClosedNav();
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      this.dispatchResizeEvent();
    }
  }

  onOrgSelectChange(
    event: MatSelectChange<string | undefined>,
    component: MatSelect,
  ) {
    if (event.value) {
      this.organizationsService.setActiveOrganizationSlug(event.value);
    } else {
      component.value = this.activeOrganizationSlug();
      this.router.navigate(["organizations", "new"]);
    }
  }

  reload() {
    this.settingsService.reload();
    this.userService.reload();
    this.organizationsService.reload();
  }
}
