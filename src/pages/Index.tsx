import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wrench, 
  Shield, 
  MessageSquare, 
  BarChart3, 
  Users, 
  CheckCircle,
  ArrowRight,
  Laptop,
  Smartphone
} from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Wrench,
      title: 'Job Management',
      description: 'Create and track repair jobs with auto-generated job sheet numbers'
    },
    {
      icon: MessageSquare,
      title: 'WhatsApp Notifications',
      description: 'Automatic customer notifications for job creation and completion'
    },
    {
      icon: Users,
      title: 'Staff Access',
      description: 'Multi-user system with role-based access for technicians and admins'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Real-time statistics and filtering options for better management'
    },
    {
      icon: Shield,
      title: 'Secure System',
      description: 'Protected access with authentication and data security'
    },
    {
      icon: CheckCircle,
      title: 'Status Tracking',
      description: 'Track repair progress from pending to completion and delivery'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0047AB] via-blue-600 to-blue-800">
      {/* Header */}
      <header className="relative z-10 px-4 pt-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white text-[#0047AB] px-4 py-2 rounded-lg font-bold text-2xl">
              FTT
            </div>
            <div className="text-white">
              <h1 className="text-xl font-semibold">Repairing Management System</h1>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/login')}
            variant="secondary"
            className="bg-white text-[#0047AB] hover:bg-gray-100"
          >
            Staff Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="mb-8 flex justify-center space-x-4">
            <div className="bg-white/10 p-4 rounded-full">
              <Laptop className="h-12 w-12" />
            </div>
            <div className="bg-white/10 p-4 rounded-full">
              <Smartphone className="h-12 w-12" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Professional
            <span className="block text-yellow-300">Repair Management</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Streamline your laptop and desktop repair service center with automated job tracking, 
            WhatsApp notifications, and comprehensive management tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/login')}
              className="bg-white text-[#0047AB] hover:bg-gray-100 px-8 py-3 text-lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#0047AB] px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-4 py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need to Manage Repairs
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Comprehensive features designed specifically for repair service centers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                  <CardHeader>
                    <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-blue-100">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white mb-4">
                Ready to Transform Your Repair Business?
              </CardTitle>
              <CardDescription className="text-xl text-blue-100">
                Join repair centers already using FTT to streamline their operations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-8 py-3 text-lg font-semibold"
              >
                Start Managing Repairs Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="mt-8 text-sm text-blue-200">
                <p>Demo credentials available on login page</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-white/20">
        <div className="max-w-7xl mx-auto text-center text-blue-200">
          <p>&copy; 2024 FTT Repairing Management System. Built for professional repair centers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;