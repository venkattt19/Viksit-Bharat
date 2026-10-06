# Databricks AI Integration Setup Guide

## Overview

This guide explains how to set up and use the AI-powered project insights feature in your Viksit Bharat Management System. The system uses text analytics to provide sentiment analysis, risk detection, and topic extraction for project descriptions.

## Features

The AI integration provides:

1. **Sentiment Analysis** - Detects if projects are progressing well (positive), facing issues (negative), or neutral
2. **Risk Detection** - Identifies concerning patterns like:
   - Safety concerns
   - Schedule delays
   - Budget overruns
   - Quality issues
   - Labor shortages
   - Material issues
3. **Topic Extraction** - Identifies key themes in project descriptions
4. **AI Summaries** - Generates concise summaries of project status

## Current Implementation

The system is **already deployed and ready to use** with a rule-based text analysis engine that mimics Databricks Foundation Model capabilities. No additional setup is required.

### How It Works

1. The Edge Function analyzes text using pattern matching and keyword detection
2. Sentiment is calculated based on positive/negative word frequency
3. Risk flags are triggered when concerning keywords are detected
4. Topics are extracted based on domain-specific keyword matching

## Using the AI Insights

### Step 1: Access the Dashboard

1. Log in to your Viksit Bharat Management System
2. Navigate to the Dashboard page

### Step 2: Open AI Insights

1. In the "Quick Actions" section, click the **"AI Project Insights"** button (purple card with brain icon)
2. The AI insights panel will open below

### Step 3: Analyze Projects

**For New Projects:**
- Projects that haven't been analyzed will appear under "Pending Analysis"
- Click the **"Analyze"** button next to any project
- The system will process the project description and display insights

**For Analyzed Projects:**
- View sentiment score and label (positive/neutral/negative)
- Review extracted topics
- Check any risk flags detected
- Read the AI-generated summary
- Click **"Re-analyze"** to update insights with current data

### Step 4: Interpret Results

**Sentiment Indicators:**
- 🔼 Green/Positive: Project is progressing well
- ➖ Gray/Neutral: No strong positive or negative signals
- 🔽 Red/Negative: Project may be facing challenges

**Risk Flags:**
- Orange badges show detected issues
- Common flags: Safety Concern, Schedule Delay, Budget Overrun, Quality Issue, Labor Shortage, Material Issue

**Topics:**
- Blue badges show identified themes
- Examples: construction, safety, budget, timeline, quality, labor

## Upgrading to Databricks Foundation Models (Optional)

If you want to use actual Databricks AI models instead of the rule-based system:

### Prerequisites

1. Databricks workspace account
2. Databricks SQL Warehouse
3. Access to Databricks Foundation Models API
4. Databricks personal access token

### Configuration Steps

1. **Get Databricks Credentials:**
   ```
   - Workspace URL: https://[your-workspace].cloud.databricks.com
   - Access Token: Generate from User Settings > Access Tokens
   - SQL Warehouse ID: Get from SQL Warehouses page
   ```

2. **Set Environment Variables:**

   The system administrator needs to add these secrets to the Supabase Edge Functions:

   ```bash
   DATABRICKS_HOST=https://[your-workspace].cloud.databricks.com
   DATABRICKS_TOKEN=[your-access-token]
   DATABRICKS_WAREHOUSE_ID=[your-warehouse-id]
   ```

3. **Update the Edge Function:**

   Replace the `analyzeText` function in `supabase/functions/databricks-ai-analysis/index.ts` with actual Databricks API calls:

   ```typescript
   async function analyzeText(text: string): Promise<AnalysisResult> {
     const databricksHost = Deno.env.get("DATABRICKS_HOST");
     const databricksToken = Deno.env.get("DATABRICKS_TOKEN");
     const warehouseId = Deno.env.get("DATABRICKS_WAREHOUSE_ID");

     // Call Databricks SQL AI functions
     const query = `
       SELECT
         ai_analyze_sentiment(text) as sentiment,
         ai_extract_topics(text) as topics,
         ai_summarize(text) as summary
       FROM (SELECT '${text}' as text)
     `;

     const response = await fetch(
       `${databricksHost}/api/2.0/sql/statements`,
       {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${databricksToken}`,
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           warehouse_id: warehouseId,
           statement: query,
         }),
       }
     );

     const result = await response.json();
     // Process result and return AnalysisResult
   }
   ```

4. **Redeploy the Edge Function:**

   The function will automatically use the new Databricks integration once updated.

## Database Schema

The following columns were added to the `projects` table:

```sql
sentiment_score     numeric          -- Score from -1 (negative) to 1 (positive)
sentiment_label     text             -- 'positive', 'neutral', or 'negative'
key_topics          text[]           -- Array of extracted topics
risk_flags          text[]           -- Array of detected risk flags
ai_summary          text             -- AI-generated summary
last_analyzed_at    timestamptz      -- Timestamp of last analysis
```

## API Endpoint

The AI analysis is available via Edge Function:

**Endpoint:** `https://lxuevsiqijffcvdnhtpq.supabase.co/functions/v1/databricks-ai-analysis`

**Method:** POST

**Request Body:**
```json
{
  "text": "Project description to analyze",
  "project_id": "optional-project-id"
}
```

**Response:**
```json
{
  "sentiment_score": 0.75,
  "sentiment_label": "positive",
  "key_topics": ["construction", "safety"],
  "risk_flags": [],
  "ai_summary": "Project summary..."
}
```

## Best Practices

1. **Analyze Regularly:** Re-analyze projects periodically as descriptions are updated
2. **Act on Risk Flags:** Investigate projects with multiple risk flags immediately
3. **Monitor Sentiment Trends:** Track sentiment over time to identify deteriorating projects
4. **Update Descriptions:** Provide detailed project descriptions for better AI insights
5. **Combine with Other Data:** Use AI insights alongside attendance, wages, and fraud detection

## Troubleshooting

**Issue: Analysis button not working**
- Check browser console for errors
- Verify network connectivity
- Ensure you're logged in

**Issue: No insights displayed**
- Verify project has a description
- Check that the Edge Function is deployed
- Review browser network tab for API errors

**Issue: Inaccurate sentiment**
- Current rule-based system works best with clear positive/negative language
- Consider upgrading to Databricks Foundation Models for better accuracy
- Ensure project descriptions are detailed and descriptive

## Support

For issues or questions:
- Check browser console logs
- Review Edge Function logs in Supabase Dashboard
- Verify database migrations were applied successfully
- Ensure environment variables are configured correctly

## Next Steps

1. Start analyzing existing projects to establish baselines
2. Monitor risk flags and take corrective action
3. Track sentiment trends over time
4. Consider upgrading to Databricks Foundation Models for enhanced accuracy
5. Integrate insights with approval workflows and reporting
