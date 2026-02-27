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
        "Events beyond your plan limit will be dropped for the remainder of the billing period. You can upgrade your plan at any time to increase your limit.",
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
      question: "What is HIPAA compliance and do I need it?",
      answer:
        "HIPAA compliance is required for organizations that handle protected health information (PHI). If your application processes healthcare data, you may need our HIPAA-compliant hosting add-on.",
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
        "We accept all major credit cards through our payment processor. For annual plans or invoicing, contact us at sales@glitchtip.com.",
    },
    {
      question: "What's the difference between Priority and Dedicated support?",
      answer:
        "Priority support includes email and livechat support during business hours. Dedicated support (Scale plan) includes development support and compliance certificates.",
    },
  ];

  selfHostedFaqs = [
    {
      question: "Is GlitchTip really free to self-host?",
      answer:
        "Yes. The Community Edition is MIT-licensed and free to use with unlimited events, projects, and team members. No license key is required.",
    },
    {
      question: "Do I need a Commercial License to use GlitchTip at work?",
      answer:
        "The Community Edition can be used at work under the MIT license. A Commercial License is recommended for businesses that want priority support, update assistance, and a license key for premium features.",
    },
    {
      question: "What's included in the Commercial License?",
      answer:
        "The Commercial License includes a license key for premium features, installation assistance (optional $500 one-time), update assistance, and priority email and livechat support.",
    },
    {
      question: "How do I install GlitchTip?",
      answer:
        "GlitchTip can be installed on your own infrastructure using Docker. See our installation documentation for step-by-step guides. For a one-time $500 fee, we can also set it up for you on platforms such as DigitalOcean, AWS, or Heroku.",
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
        "Self-hosted pricing is per-user rather than per-event. The Community Edition is free. Commercial and Scaled Support plans are billed per user per month, with annual billing discounts available.",
    },
    {
      question: "Will GlitchTip's license ever change?",
      answer:
        "The Community Edition is MIT-licensed and will remain open source. We are committed to keeping GlitchTip's core freely available.",
    },
    {
      question:
        "What's the difference between Community and Commercial License?",
      answer:
        "The Community Edition is MIT-licensed and free. The Commercial License adds a license key for premium features, priority support, update assistance, and installation help.",
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
        "With Scaled Support, we can join your company's chat service such as Slack or Rocket.Chat to help your team get started. We'll help you integrate your apps and prioritize development requests.",
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
        { text: "MIT licensed" },
      ],
      monthlyPrice: "Free",
    },
    {
      name: "Starter",
      subtitle: "For small teams",
      includesFrom: "Hobby",
      features: [
        { text: "up to 100k events/mo" },
        {
          text: "License Key",
          tooltip:
            "A license key unlocks premium features when self-hosting GlitchTip",
        },
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
        { text: "Priority email and livechat support" },
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
        { text: "Development support" },
        {
          text: "Compliance Certificates",
          tooltip:
            "SOC 2 Type II and HIPAA compliance certificates available upon request",
        },
      ],
      monthlyPrice: 250,
      annualPrice: 2500,
    },
  ];

  selfHostedPlanOptions: PlanOption[] = [
    {
      name: "Community Edition",
      subtitle: "For personal use and open source projects",
      features: [
        { text: "Unlimited usage" },
        { text: "Host on your infrastructure" },
        { text: "Unlimited projects" },
        { text: "Community support" },
        { text: "MIT licensed" },
      ],
      monthlyPrice: "Free",
      ctaText: "Get started",
      ctaUrl: "https://glitchtip.com/documentation/install",
    },
    {
      name: "Individual License",
      subtitle: "Developer use for 1 user",
      includesFrom: "Community",
      features: [{ text: "Individual license Key" }],
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
        { text: "Installation assistance (optional $500 one-time)" },
        { text: "Update assistance" },
        { text: "Commercial License Key" },
        { text: "Priority email and livechat support" },
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
        { text: "Development support" },
        { text: "Compliance Certificates" },
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
