import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Smile } from "lucide-react";
import { PnLCalendar } from "./PnLCalendar";
import { RecentTrades } from "./RecentTrades";

interface Trade {
  id: string;
  pnl_neto: number;
  fecha: string;
  simbolo: string;
  reglas_cumplidas: boolean;
  emocion?: string;
}

export const Dashboard = () => {
  const { data: trades = [] } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("fecha", { ascending: true });
      
      if (error) throw error;
      return data as Trade[];
    },
  });

  const calculateMetrics = () => {
    const totalTrades = trades.length;
    const pnlTotal = trades.reduce((sum, t) => sum + Number(t.pnl_neto), 0);
    const winningTrades = trades.filter(t => Number(t.pnl_neto) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const rulesComplied = trades.filter(t => t.reglas_cumplidas).length;
    const ruleComplianceRate = totalTrades > 0 ? (rulesComplied / totalTrades) * 100 : 0;
    
    // Calcular la emoción más frecuente
    const emocionesMap = new Map<string, number>();
    
    trades.forEach(trade => {
      if (trade.emocion) {
        const count = emocionesMap.get(trade.emocion) || 0;
        emocionesMap.set(trade.emocion, count + 1);
      }
    });
    
    let emocionFrecuente = "-";
    let maxCount = 0;
    
    emocionesMap.forEach((count, emocion) => {
      if (count > maxCount) {
        maxCount = count;
        emocionFrecuente = emocion;
      }
    });

    return { totalTrades, pnlTotal, winRate, ruleComplianceRate, emocionFrecuente };
  };

  const metrics = calculateMetrics();
  const isProfitable = metrics.pnlTotal > 0;

  return (
    <div className="space-y-6">
      {/* Fila superior con dos columnas: Calendario y Trades Recientes */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna izquierda (principal): Calendario de PnL */}
        <div className="md:col-span-2">
          <PnLCalendar />
        </div>
        
        {/* Columna derecha (lateral): Trades Recientes */}
        <div className="md:col-span-1">
          <RecentTrades />
        </div>
      </div>
      
      {/* Fila inferior: Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PnL Total
            </CardTitle>
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-[hsl(var(--profit))]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[hsl(var(--loss))]" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? 'text-[hsl(var(--profit))]' : 'text-[hsl(var(--loss))]'}`}>
              ${metrics.pnlTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalTrades} operaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Acierto
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Win rate general
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cumplimiento de Reglas
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.ruleComplianceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Disciplina de trading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emoción Frecuente
            </CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.emocionFrecuente}
            </div>
            <p className="text-xs text-muted-foreground">
              Basado en tus trades
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
