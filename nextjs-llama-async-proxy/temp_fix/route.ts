// app/api/parameters/[category]/[paramName]/route.ts
import { NextRequest } from 'next/server';

// Mock services (these would be properly connected in a real implementation)
let parameterService = {
  getOption: (category: string, paramName: string): Record<string, any> | null => null,
  getParameterInfo: (paramName: string): Record<string, any> | null => null
};

export async function GET(req: NextRequest, { params }: { params: { category: string; paramName: string } }) {
  try {
    const param = parameterService.getOption(params.category, params.paramName);
    
    if (!param) {
      return Response.json({ error: 'Parameter not found' }, { status: 404 });
    }

    const info = parameterService.getParameterInfo(params.paramName);
    return Response.json({
      success: true,
      parameter: params.paramName,
      category: params.category,
      ...param,
      ...info
    });
  } catch (error) {
    console.error('Error fetching parameter info:', error);
    return Response.json({ error: 'Failed to fetch parameter info' }, { status: 500 });
  }
}