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
  Clock,
  AlertTriangle,
  Archive,
} from "lucide-react";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "DataBridge - Enterprise Database Management Platform" },
    {
      name: "description",
      content:
        "Professional PostgreSQL database management with enterprise-grade security, automated backups, and intuitive controls.",
    },
  ];
}

export default function Home() {
  const { isAuthenticated, login } = useUserStore();

  const features = [
    {
      icon: Database,
      title: "Instant Deployment",
      description:
        "Deploy production-ready PostgreSQL databases in under 30 seconds with auto-generated secure credentials.",
      color: "bg-chart-1",
      accent: "bg-chart-1/10 border-chart-1/20",
    },
    {
      icon: Shield,
      title: "IP Firewall Security",
      description:
        "PostgreSQL native access control with pg_hba.conf integration. Whitelist specific IPs and control database access.",
      color: "bg-chart-2",
      accent: "bg-chart-2/10 border-chart-2/20",
    },
    {
      icon: RefreshCw,
      title: "Password Rotation",
      description:
        "Automated 30-day password rotation with encrypted storage and seamless credential updates.",
      color: "bg-chart-3",
      accent: "bg-chart-3/10 border-chart-3/20",
    },
    {
      icon: Search,
      title: "SQL Query Interface",
      description:
        "Execute SQL queries, browse tables, and manage data with multi-row operations and real-time results.",
      color: "bg-chart-4",
      accent: "bg-chart-4/10 border-chart-4/20",
    },
    {
      icon: Archive,
      title: "Automated Backups",
      description:
        "Weekly automated backups with Cloudinary storage, one-click downloads, and 30-day retention.",
      color: "bg-chart-5",
      accent: "bg-chart-5/10 border-chart-5/20",
    },
    {
      icon: MessageSquare,
      title: "Discord Integration",
      description:
        "Real-time notifications for database events, password rotations, and backup completions via Discord webhooks.",
      color: "bg-primary",
      accent: "bg-primary/10 border-primary/20",
    },
  ];

  const stats = [
    { label: "Database Creation", value: "<30s", icon: Database },
    { label: "Password Rotation", value: "30 Days", icon: Clock },
    { label: "Backup Retention", value: "30 Days", icon: Archive },
    { label: "Idle Detection", value: "7 Days", icon: AlertTriangle },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Elegant Background Elements using theme colors */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-chart-3/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-chart-2/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-8 inline-flex items-center gap-2 bg-primary text-primary-foreground border-0 px-6 py-3 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
              <Database className="w-4 h-4" />
              Enterprise PostgreSQL Platform
            </Badge>

            <h1 className="text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-tight">
              Database Management
              <span className="block mt-4 bg-gradient-to-r from-primary via-chart-2 to-chart-1 bg-clip-text text-transparent">
                Simplified
              </span>
            </h1>

            <p className="mx-auto mt-10 max-w-4xl text-xl lg:text-2xl text-muted-foreground leading-relaxed font-light">
              Professional PostgreSQL management with automated security,
              intelligent lifecycle management, and developer-first design for
              modern applications.
            </p>

            <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to={isAuthenticated ? "/console" : "#"}
                className="flex items-center gap-2"
              >
                <Button
                  size="lg"
                  className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-primary/25 transition-all duration-500 transform hover:scale-105"
                  onClick={() => {
                    if (!isAuthenticated) {
                      login({ authProvider: "github" });
                    }
                  }}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isAuthenticated ? "Launch Console" : "Start Building"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg font-semibold border-2 border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl transition-all duration-300"
              >
                View Documentation
              </Button>
            </div>

            {/* Stats Section */}
            <div className="mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="text-center group">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8 bg-accent/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-24">
            <Badge className="mb-6 bg-secondary text-secondary-foreground px-4 py-2 rounded-full">
              Core Features
            </Badge>
            <h2 className="text-6xl font-bold text-foreground mb-8">
              Built for Production Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light">
              Everything you need for professional database management,
              automated and secure
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={idx}
                  className={`group relative overflow-hidden bg-card/80 backdrop-blur-sm ${feature.accent} hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-105`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-card/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <CardHeader className="relative pb-4">
                    <div
                      className={`w-20 h-20 ${feature.color} rounded-3xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-card-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-muted-foreground leading-relaxed text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Showcase */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge className="bg-chart-2 text-white px-4 py-2 rounded-full">
                Production Security
              </Badge>
              <h2 className="text-5xl font-bold text-foreground">
                PostgreSQL Native
                <span className="block bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">
                  Access Control
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Direct integration with PostgreSQL's pg_hba.conf for
                enterprise-grade network access control and authentication
                management.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Shield, label: "IP Whitelisting" },
                  { icon: Lock, label: "Auth Methods" },
                  { icon: Network, label: "CIDR Support" },
                  { icon: RefreshCw, label: "Auto Rotation" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-xl bg-chart-2/10 border border-chart-2/20"
                  >
                    <item.icon className="w-6 h-6 text-chart-2" />
                    <span className="font-semibold text-foreground">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-chart-2/20 to-primary/20 rounded-3xl blur-2xl"></div>
              <Card className="relative bg-slate-900/95 backdrop-blur-sm border-slate-700 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-slate-400 font-mono text-sm">
                      pg_hba.conf
                    </span>
                  </div>
                  <div className="font-mono text-sm space-y-2">
                    <div className="text-slate-500"># Local connections</div>
                    <div className="text-green-400">local all all trust</div>
                    <div className="text-green-400">
                      host all all 127.0.0.1/32 trust
                    </div>
                    <div className="text-green-400">
                      host all all ::1/128 trust
                    </div>
                    <div className="text-slate-500 mt-4"># Whitelisted IPs</div>
                    <div className="text-cyan-400">
                      host all all192.0.1.9/32 scram-sha-256
                    </div>
                    <div className="text-cyan-400">
                      host all all 142.250.182.219/32 scram-sha-256
                    </div>
                    <div className="text-slate-500 mt-4">
                      # Auto-generated rules
                    </div>
                    <div className="text-purple-400">
                      host mydb_abc123 user_project 192.168.1.100/32 md5
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Card className="relative overflow-hidden bg-gradient-to-r from-primary via-chart-1 to-chart-2 border-0 shadow-2xl rounded-3xl">
            <div className="absolute inset-0">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>
            <CardContent className="relative px-12 py-20 text-center">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Database className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-5xl font-bold text-white mb-8">
                Ready to Automate Your
                <span className="block text-white/90">
                  Database Management?
                </span>
              </h3>
              <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join developers who trust DataBridge for automated backups,
                password rotation, and secure database hosting
              </p>
              <Link
                to={isAuthenticated ? "/console" : "#"}
                className="inline-block"
              >
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 px-10 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    if (!isAuthenticated) {
                      login({ authProvider: "github" });
                    }
                  }}
                >
                  Start Your Project
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <div className="mt-8 flex items-center justify-center gap-8 text-white/80 text-sm">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  IP Firewall Protection
                </span>
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Auto Password Rotation
                </span>
                <span className="flex items-center gap-2">
                  <Archive className="w-4 h-4" />
                  Weekly Backups
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-16 sm:px-6 lg:px-8 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent mb-6">
              DataBridge
            </div>
            <p className="text-muted-foreground font-light">
              © 2025 DataBridge. Professional database management with automated
              security.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
