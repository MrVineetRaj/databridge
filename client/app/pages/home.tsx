import { useTRPC } from "~/lib/trpc.config";
import type { Route } from "./+types/home";
import { useQuery } from "@tanstack/react-query";
import { useUserStore } from "~/store/user-store";
import { useEffect } from "react";
import { Navbar } from "~/components/shared/nav-bar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  ArrowRight,
  Database,
  Shield,
  RefreshCw,
  Search,
  Settings,
  MessageSquare,
  Lock,
  Network,
} from "lucide-react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "DataBridge - Database Management Made Simple" },
    {
      name: "description",
      content: "Create, manage, and backup your databases with ease.",
    },
  ];
}

export default function Home() {
  const { isAuthenticated, login } = useUserStore();

  const features = [
    {
      icon: Database,
      title: "Instant Database Creation",
      description:
        "Spin up PostgreSQL databases in seconds with auto-generated secure credentials.",
      color: "bg-chart-1",
    },
    {
      icon: Shield,
      title: "IP Firewall Protection",
      description:
        "Control database access with IP whitelisting and network security rules for enterprise-grade protection.",
      color: "bg-chart-2",
    },
    {
      icon: RefreshCw,
      title: "Automated Backups",
      description:
        "Weekly automated backups with one-click restore functionality for peace of mind.",
      color: "bg-chart-3",
    },
    {
      icon: Search,
      title: "Query & Manage Data",
      description:
        "Execute SQL queries, browse tables, and edit data directly from your dashboard.",
      color: "bg-chart-4",
    },
    {
      icon: Settings,
      title: "Database Lifecycle",
      description:
        "Pause, resume, and manage your databases with scheduled password rotation.",
      color: "bg-chart-5",
    },
    {
      icon: MessageSquare,
      title: "Discord Integration",
      description:
        "Get notifications about your database events directly in your Discord channels.",
      color: "bg-primary",
    },
  ];

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-accent to-secondary">
      <Navbar />

      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-chart-1/20 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-chart-3/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-6 inline-flex items-center gap-2 bg-primary text-primary-foreground border-0 px-4 py-2 text-sm font-medium animate-bounce">
              🚀 PostgreSQL Database Management
            </Badge>

            <h1 className="mt-8 text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground">
              Database Management
              <span className="block mt-2 bg-linear-to-r from-primary via-chart-2 to-chart-1 bg-clip-text text-transparent animate-pulse">
                Made Simple
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground leading-relaxed">
              Create and manage PostgreSQL databases with enterprise-grade security. Get automated
              backups, IP firewall protection, and powerful query tools - all from
              one dashboard.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to={isAuthenticated ? "/console" : "#"}
                className="flex items-center gap-2"
              >
                <Button
                  size="lg"
                  className="group bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105"
                  onClick={() => {
                    if (!isAuthenticated) {
                      login({ authProvider: "github" });
                    }
                  }}
                >
                  {isAuthenticated ? "Go to Console" : "Get Started Free"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-secondary text-secondary-foreground border-border">
              ⚡ Core Features
            </Badge>
            <h2 className="text-5xl font-bold text-foreground">
              Everything you need for database management
            </h2>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for developers who want reliable, secure database hosting
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className="group relative overflow-hidden bg-card border-border hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3"
                >
                  <div
                    className={`absolute inset-0 ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  ></div>
                  <CardHeader className="relative">
                    <div
                      className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-card-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Spotlight Section */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-chart-2/10 to-primary/10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-chart-2/20 text-chart-2 border-chart-2/30">
              🔒 Enterprise Security
            </Badge>
            <h2 className="text-4xl font-bold text-foreground">
              Production-Ready Security Features
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Card className="border-chart-2/30 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-12 h-12 text-chart-2" />
                    <Network className="w-8 h-8 text-chart-1" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    IP Firewall & Access Control
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Configure network access rules, whitelist specific IPs, and control who can connect to your databases with enterprise-grade security.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      ✅ IP address whitelisting
                    </li>
                    <li className="flex items-center gap-2">
                      ✅ CIDR range support
                    </li>
                    <li className="flex items-center gap-2">
                      ✅ Real-time access control
                    </li>
                    <li className="flex items-center gap-2">
                      ✅ PostgreSQL pg_hba.conf integration
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative">
              <div className="bg-slate-900 rounded-lg p-6 text-green-400 font-mono text-sm shadow-2xl">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-2">pg_hba.conf</span>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-500"># Allow localhost connections</div>
                  <div>host all all 127.0.0.1/32 trust</div>
                  <div className="text-slate-500"># Whitelist office network</div>
                  <div>host all all 192.168.1.0/24 md5</div>
                  <div className="text-slate-500"># Allow specific IP</div>
                  <div>host all all 10.0.0.1/32 scram-sha-256</div>
                  <div className="text-slate-500"># Block all others by default</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8 bg-accent/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-foreground">
              Simple 3-Step Process
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-chart-1 rounded-full flex items-center justify-center text-white font-bold mb-6 mx-auto text-xl">
                  1
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-4 text-center">
                  Create Project
                </h4>
                <p className="text-muted-foreground text-center">
                  Sign up with GitHub and create your first database project
                  with just a title and description.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-chart-2 rounded-full flex items-center justify-center text-white font-bold mb-6 mx-auto text-xl">
                  2
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-4 text-center">
                  Configure Security
                </h4>
                <p className="text-muted-foreground text-center">
                  Set up IP firewall rules and receive auto-generated secure 
                  database credentials instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className="w-12 h-12 bg-chart-3 rounded-full flex items-center justify-center text-white font-bold mb-6 mx-auto text-xl">
                  3
                </div>
                <h4 className="text-xl font-bold text-card-foreground mb-4 text-center">
                  Start Building
                </h4>
                <p className="text-muted-foreground text-center">
                  Connect your application and start building. Manage data
                  through our web interface with peace of mind.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Card className="relative overflow-hidden bg-linear-to-br from-primary via-chart-1 to-chart-3 border-0 shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <CardContent className="relative pt-16 pb-16">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Database className="w-16 h-16 text-white/80" />
                <Lock className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-6">
                Ready to simplify database management?
              </h3>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join developers who trust DataBridge for reliable PostgreSQL
                hosting with enterprise-grade security
              </p>
              <Link
                to={isAuthenticated ? "/console" : "#"}
                className="flex items-center gap-2 px-4"
              >
                <Button
                  size="lg"
                  className="bg-white text-foreground hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    if (!isAuthenticated) {
                      login({ authProvider: "github" });
                    }
                  }}
                >
                  Start Your First Project
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <p className="text-white/70 text-sm mt-4">
                Free to get started • Secure by default • IP Firewall included
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-16 sm:px-6 lg:px-8 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="text-2xl font-bold bg-linear-to-r from-primary to-chart-1 bg-clip-text text-transparent mb-4">
              DataBridge
            </div>
            <p className="text-muted-foreground">
              © 2025 DataBridge. Simplifying database management for developers.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}