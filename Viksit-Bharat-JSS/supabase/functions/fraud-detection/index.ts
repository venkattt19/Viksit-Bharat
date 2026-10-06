import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FraudCheckRequest {
  entityType: 'attendance' | 'worker' | 'work_progress' | 'wage';
  entityId: string;
  data: Record<string, any>;
}

interface DatabricksResponse {
  fraudDetected: boolean;
  confidence: number;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  analysis: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { entityType, entityId, data }: FraudCheckRequest = await req.json();

    const analysis = await performFraudAnalysis(entityType, data);

    if (analysis.fraudDetected) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      const response = await fetch(`${supabaseUrl}/rest/v1/fraud_alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey || '',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          alert_type: analysis.alertType,
          severity: analysis.severity,
          entity_type: entityType,
          entity_id: entityId,
          description: analysis.description,
          ai_confidence: analysis.confidence,
          databricks_analysis: analysis.analysis,
          status: 'new',
        }),
      });

      if (!response.ok) {
        console.error('Failed to create fraud alert:', await response.text());
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fraudDetected: analysis.fraudDetected,
        confidence: analysis.confidence,
        severity: analysis.severity,
        description: analysis.description,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in fraud detection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function performFraudAnalysis(
  entityType: string,
  data: Record<string, any>
): Promise<DatabricksResponse> {
  const databricksToken = Deno.env.get('DATABRICKS_TOKEN');
  const databricksEndpoint = Deno.env.get('DATABRICKS_ENDPOINT');

  if (!databricksToken || !databricksEndpoint) {
    throw new Error('DATABRICKS_TOKEN and DATABRICKS_ENDPOINT must be configured in Supabase Edge Function secrets for face recognition to work');
  }

  try {
    const response = await fetch(databricksEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${databricksToken}`,
      },
      body: JSON.stringify({
        dataframe_records: [{
          entityType,
          worker_id: data.worker_id,
          worker_name: data.worker_name,
          project_id: data.project_id,
          project_name: data.project_name,
          captured_image: data.captured_image,
          registered_image: data.registered_image,
          check_in_latitude: data.check_in_location?.latitude,
          check_in_longitude: data.check_in_location?.longitude,
          project_latitude: data.project_location?.latitude,
          project_longitude: data.project_location?.longitude,
          attendance_date: data.attendance_date,
        }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Databricks API error:', errorText);
      throw new Error(`Databricks API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return {
      fraudDetected: result.predictions?.[0]?.fraud_detected || false,
      confidence: result.predictions?.[0]?.confidence || 0,
      alertType: result.predictions?.[0]?.alert_type || 'none',
      severity: result.predictions?.[0]?.severity || 'low',
      description: result.predictions?.[0]?.description || 'Analysis complete',
      analysis: result.predictions?.[0] || {},
    };
  } catch (error) {
    console.error('Error calling Databricks:', error);
    throw error;
  }
}

function performMockAnalysis(
  entityType: string,
  data: Record<string, any>
): DatabricksResponse {
  const mockChecks = {
    attendance: checkAttendanceFraud(data),
    worker: checkWorkerFraud(data),
    work_progress: checkWorkProgressFraud(data),
    wage: checkWageFraud(data),
  };

  return mockChecks[entityType as keyof typeof mockChecks] || {
    fraudDetected: false,
    confidence: 0,
    alertType: 'none',
    severity: 'low',
    description: 'No fraud detected',
    analysis: {},
  };
}

function checkAttendanceFraud(data: Record<string, any>): DatabricksResponse {
  const faceMatchScore = data.face_match_score || 0;

  if (faceMatchScore < 70) {
    return {
      fraudDetected: true,
      confidence: 85,
      alertType: 'low_face_match',
      severity: 'high',
      description: `Face match score of ${faceMatchScore}% is below threshold`,
      analysis: {
        faceMatchScore,
        threshold: 70,
        recommendation: 'Manual verification required',
      },
    };
  }

  const checkInLocation = data.check_in_location;
  const projectLocation = data.project_location;

  if (checkInLocation && projectLocation) {
    const distance = calculateDistance(
      checkInLocation.latitude,
      checkInLocation.longitude,
      projectLocation.latitude,
      projectLocation.longitude
    );

    if (distance > 1) {
      return {
        fraudDetected: true,
        confidence: 92,
        alertType: 'location_mismatch',
        severity: 'critical',
        description: `Check-in location is ${distance.toFixed(2)}km away from project site`,
        analysis: {
          distance,
          checkInLocation,
          projectLocation,
        },
      };
    }
  }

  return {
    fraudDetected: false,
    confidence: 95,
    alertType: 'none',
    severity: 'low',
    description: 'Attendance appears legitimate',
    analysis: { faceMatchScore },
  };
}

function checkWorkerFraud(data: Record<string, any>): DatabricksResponse {
  return {
    fraudDetected: false,
    confidence: 90,
    alertType: 'none',
    severity: 'low',
    description: 'Worker registration appears legitimate',
    analysis: {},
  };
}

function checkWorkProgressFraud(data: Record<string, any>): DatabricksResponse {
  const imagesCount = data.images?.length || 0;

  if (imagesCount === 0) {
    return {
      fraudDetected: true,
      confidence: 75,
      alertType: 'missing_evidence',
      severity: 'medium',
      description: 'Work progress submitted without photographic evidence',
      analysis: { imagesCount },
    };
  }

  return {
    fraudDetected: false,
    confidence: 88,
    alertType: 'none',
    severity: 'low',
    description: 'Work progress appears legitimate',
    analysis: { imagesCount },
  };
}

function checkWageFraud(data: Record<string, any>): DatabricksResponse {
  const daysWorked = data.days_worked || 0;
  const dailyRate = data.daily_rate || 0;

  if (daysWorked > 31) {
    return {
      fraudDetected: true,
      confidence: 98,
      alertType: 'invalid_days',
      severity: 'critical',
      description: `Days worked (${daysWorked}) exceeds maximum possible days in a month`,
      analysis: { daysWorked },
    };
  }

  if (dailyRate > 2000) {
    return {
      fraudDetected: true,
      confidence: 80,
      alertType: 'unusual_rate',
      severity: 'high',
      description: `Daily rate of ₹${dailyRate} is unusually high`,
      analysis: { dailyRate, averageRate: 500 },
    };
  }

  return {
    fraudDetected: false,
    confidence: 93,
    alertType: 'none',
    severity: 'low',
    description: 'Wage calculation appears legitimate',
    analysis: { daysWorked, dailyRate },
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
