import { Component, ViewChild, AfterViewChecked, input, inject } from "@angular/core";
import { MatTabGroup, MatTabsModule } from "@angular/material/tabs";
import { LinksService } from "../../links.service";
import { environment } from "src/environments/environment";
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from "@angular/material/card";
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatDivider } from "@angular/material/divider";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { DecimalPipe } from "@angular/common";
import { PricingAddonCardComponent } from "../pricing-addon-card/pricing-addon-card.component";

interface PlanFeature {
  text: string;
  tooltip?: string;
}

interface PlanOption {
  name: string;
  subtitle: string;
  includesFrom?: string;
  features: PlanFeature[];
  monthlyPrice: number | "Free" | "Custom";
  annualPrice?: number | "Custom";
  priceSuffix?: string;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Copied HTML from the frontend version of this, pulled some data that is
 * currently in use and hardcoded here, and sharing the SCSS file
 */
@Component({
  selector: "mkt-payment",
  templateUrl: "./payment.component.html",
  imports: [
    DecimalPipe,
    MatTabsModule,
    MatCard,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    MatIcon,
    MatTooltip,
    MatExpansionModule,
    MatDivider,
    MatButtonToggleModule,
    RouterLink,
    PricingAddonCardComponent,
  ],
  styleUrls: [
    "../../../../../../src/app/settings/subscription/payment/payment.component.scss",
    "./payment.component.scss",
  ],
})
export class PaymentComponent implements AfterViewChecked {
  private links = inject(LinksService);

  @ViewChild("tabs", { static: false }) tabs?: MatTabGroup;
  readonly pricingPage = input<boolean>(false);
  billingEmail = environment.billingEmail;
  registerLink = this.links.registerLink;
  selectedTab = 0;
  billingPeriod: "monthly" | "annual" = "monthly";

  hostedFaqs = [
    {
      question: "What is an event?",
      answer:
        "An event is when your project sends us data one time. For example, if ten users trigger the same bug, GlitchTip will receive ten events.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Our Hobby plan is free forever with up to 1,000 events per month. You can upgrade to a paid plan at any time.",
    },
    {
      question: "What happens when I exceed my event limit?",
      answer:
        "After your quota is full, we throttle by 10%. We increase this gradually until at 2x the quota we block fully. You can upgrade your plan at any time to increase your limit.",
    },
    {
      question: "Can I change plans at any time?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
    },
    {
      question: "Do you offer annual billing?",
      answer:
        "Yes, we offer annual billing with a discount. Contact us at sales@glitchtip.com for details.",
    },
    {
      question: "Can I choose where my data is hosted?",
      answer:
        "Yes, we offer hosting in both the US and EU (Germany). All plans are available on our EU instance for data sovereignty requirements.",
    },
    {
      question: "Do you offer discounts for non-profits or open source projects?",
      answer:
        "Yes, we offer discounted plans for non-profits and open source projects starting at $5 per month. Contact us at sales@glitchtip.com.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards through our payment processor. For annual plans, invoicing, or contract-based arrangements (self-hosted plans require a 10-user minimum), contact us at sales@glitchtip.com.",
    },
    {
      question: "What's the difference between Priority support and the Scale plan?",
      answer:
        "Priority support includes email & live chat support. The Scale plan adds development support & prioritization and a Business Associate Agreement (BAA) available upon request.",
    },
  ];

  selfHostedFaqs = [
    {
      question: "Is GlitchTip really free to self-host?",
      answer:
        "Yes. GlitchTip is free to self-host with unlimited events, projects, and team members. No paid plan is required. If your business uses GlitchTip in production, we expect you to purchase a license to support continued development.",
    },
    {
      question: "Do I need a Commercial License to use GlitchTip at work?",
      answer:
        "If your business uses GlitchTip at work, purchasing a Commercial License is expected. There are no premium features — what you're paying for is support.",
    },
    {
      question: "What's included in the Commercial License?",
      answer:
        "The Commercial License includes support access for your team and priority email & live chat support.",
    },
    {
      question: "How do I install GlitchTip?",
      answer:
        "GlitchTip can be installed on your own infrastructure using Docker. See our installation documentation for step-by-step guides.",
    },
    {
      question: "What are the system requirements?",
      answer:
        "GlitchTip requires Docker and a PostgreSQL database. It runs on any platform that supports Docker containers, including Linux, AWS, DigitalOcean, and Heroku.",
    },
    {
      question: "Can I get HIPAA compliance with self-hosted?",
      answer:
        "Yes. Since you control the infrastructure, you are responsible for your own security controls, BAAs with sub-processors, and compliance obligations. GlitchTip's open-source codebase is fully auditable.",
    },
    {
      question: "How is self-hosted pricing different from hosted?",
      answer:
        "Self-hosted pricing is per-user rather than per-event. The Starter Edition is free. Commercial and Scaled Support plans are billed per user per month, with annual billing discounts available.",
    },
    {
      question: "Will GlitchTip's license ever change?",
      answer:
        "GlitchTip will remain open source. We are committed to keeping it that way.",
    },
    {
      question:
        "What's the difference between Starter Edition and Commercial License?",
      answer:
        "The Starter Edition is free and includes everything GlitchTip offers. If you're running it in production, we expect you to hold a Commercial License — that's what gets you priority support from us.",
    },
    {
      question: "Can I migrate from hosted to self-hosted (or vice versa)?",
      answer:
        "Yes. Contact us at sales@glitchtip.com and we can assist with migrating your data between hosted and self-hosted instances.",
    },
    {
      question: "How do updates work for self-hosted?",
      answer:
        "You can update GlitchTip yourself at any time by pulling the latest Docker image. With a Commercial License, you can also request that we update for you monthly — you'll need to give us sufficient access to your environment.",
    },
    {
      question: "Do you offer training or onboarding?",
      answer:
        "With Scaled Support, we can join your company's chat service such as Slack or Rocket. Chat to help your team get started. We'll help you integrate your apps and prioritize development requests.",
    },
  ];

  planOptions: PlanOption[] = [
    {
      name: "Hobby",
      subtitle: "For Personal Projects",
      features: [
        { text: "Up to 1,000 events/mo" },
        { text: "Error tracking" },
        { text: "Unlimited projects" },
        { text: "Unlimited team members" },
      ],
      monthlyPrice: "Free",
    },
    {
      name: "Starter",
      subtitle: "For small teams",
      includesFrom: "Hobby",
      features: [
        { text: "up to 100k events/mo" },
        { text: "Support access" },
      ],
      monthlyPrice: 15,
      annualPrice: 150,
    },
    {
      name: "Growth",
      subtitle: "For growing businesses",
      includesFrom: "Starter",
      features: [
        { text: "up to 500k events/mo" },
        { text: "Priority email & live chat support" },
      ],
      monthlyPrice: 50,
      annualPrice: 500,
    },
    {
      name: "Scale",
      subtitle: "For large scaling organizations",
      includesFrom: "Growth",
      features: [
        { text: "up to 3 million events/mo" },
        { text: "Development support & prioritization" },
        { text: "Business Associate Agreement (BAA) available upon request" },
      ],
      monthlyPrice: 250,
      annualPrice: 2500,
    },
  ];

  selfHostedPlanOptions: PlanOption[] = [
    {
      name: "Starter Edition",
      subtitle: "For personal use and open source projects",
      features: [
        { text: "Unlimited usage" },
        { text: "Host on your infrastructure" },
        { text: "Unlimited projects" },
      ],
      monthlyPrice: "Free",
      ctaText: "Get started",
      ctaUrl: "https://glitchtip.com/documentation/install",
    },
    {
      name: "Individual License",
      subtitle: "Developer use for 1 user",
      includesFrom: "Starter",
      features: [{ text: "Support access for 1 user" }],
      monthlyPrice: 5,
      annualPrice: 50,
      ctaText: "Get started",
      ctaUrl: "mailto:sales@glitchtip.com",
    },
    {
      name: "Commercial License",
      subtitle: "For business use",
      includesFrom: "Individual",
      features: [
        { text: "Support access for your team" },
        { text: "Priority email & live chat support" },
      ],
      monthlyPrice: 15,
      annualPrice: 150,
      priceSuffix: "/user/month",
      ctaText: "Email sales@glitchtip.com",
      ctaUrl: "mailto:sales@glitchtip.com",
    },
    {
      name: "Scaled Support",
      subtitle: "For large organizations and regulated industries (10 user minimum)",
      includesFrom: "Commercial",
      features: [
        { text: "Custom Branding" },
        { text: "Single Sign On integrations" },
        { text: "Development support & prioritization" },
      ],
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      ctaText: "Email sales@glitchtip.com",
      ctaUrl: "mailto:sales@glitchtip.com",
    },
  ];

  setSelectedTab(value: number) {
    this.selectedTab = value;
  }

  ngAfterViewChecked() {
    this.tabs?.realignInkBar();
  }
}
