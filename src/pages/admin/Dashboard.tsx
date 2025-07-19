import { Card } from '@/components/ui/card';
import { BarChart3, Users, Car, Building2 } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Kunden',
      value: '24',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Autos',
      value: '156',
      icon: Car,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Kanzleien',
      value: '8',
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'PDFs generiert',
      value: '342',
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Übersicht über Ihr PDF Generator Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Neuer Kunde hinzugefügt</p>
              <p className="text-sm text-gray-500">vor 2 Stunden</p>
            </div>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Neu
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">PDF für Auto BMW X5 generiert</p>
              <p className="text-sm text-gray-500">vor 4 Stunden</p>
            </div>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              PDF
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Kanzlei-Daten aktualisiert</p>
              <p className="text-sm text-gray-500">vor 6 Stunden</p>
            </div>
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              Update
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;