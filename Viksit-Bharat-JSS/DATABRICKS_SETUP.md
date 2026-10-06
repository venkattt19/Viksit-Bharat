# Databricks Setup Guide for Viksit Bharat

The **Attendance Management** module in Viksit Bharat requires Databricks for AI-powered face recognition and fraud detection. This is a **mandatory requirement** for the system to function.

## Why Databricks is Required

The attendance system uses Databricks machine learning models to:
- **Face Recognition**: Compare captured face images against registered worker photos
- **Identity Verification**: Ensure the person marking attendance is the actual worker
- **Fraud Detection**: Detect suspicious patterns in attendance data
- **Location Validation**: Verify attendance is being marked at the correct project site

## What You Need

### 1. Databricks Workspace
- Create a Databricks workspace on Azure, AWS, or GCP
- Access URL: `https://your-workspace.cloud.databricks.com`

### 2. Machine Learning Model
You need to deploy a model that accepts face recognition data and returns fraud analysis.

#### Expected Input Format
```json
{
  "dataframe_records": [{
    "entityType": "attendance",
    "worker_id": "uuid",
    "worker_name": "Worker Name",
    "project_id": "uuid",
    "project_name": "Project Name",
    "captured_image": "base64_encoded_image",
    "registered_image": "base64_encoded_face_data",
    "check_in_latitude": 28.6139,
    "check_in_longitude": 77.2090,
    "project_latitude": 28.6100,
    "project_longitude": 77.2050,
    "attendance_date": "2024-03-16"
  }]
}
```

#### Expected Output Format
```json
{
  "predictions": [{
    "fraud_detected": false,
    "confidence": 95.5,
    "alert_type": "none",
    "severity": "low",
    "description": "Face verification successful. Attendance appears legitimate.",
    "face_match_score": 92.3,
    "location_distance_km": 0.5
  }]
}
```

### 3. Model Deployment
1. Train your face recognition model in Databricks
2. Deploy it as a Model Serving endpoint
3. Get the endpoint URL (looks like):
   ```
   https://your-workspace.cloud.databricks.com/serving-endpoints/viksit-bharat-face-recognition/invocations
   ```

### 4. Access Token
1. Go to User Settings → Access Tokens in Databricks
2. Generate a new personal access token
3. Copy and save it securely

## Configuration in Supabase

Once you have your Databricks credentials, configure them as Edge Function secrets:

### Required Secrets

1. **DATABRICKS_TOKEN**
   - Your Databricks personal access token
   - Used for API authentication

2. **DATABRICKS_ENDPOINT**
   - Full URL to your model serving endpoint
   - Example: `https://your-workspace.cloud.databricks.com/serving-endpoints/viksit-bharat-face-recognition/invocations`

### How to Add Secrets

Secrets are automatically configured in your Supabase project. The system administrator will set these up.

## Model Recommendations

### Face Recognition Model
- Use deep learning models like FaceNet, VGGFace, or ArcFace
- Train on diverse Indian facial datasets for better accuracy
- Include features for:
  - Face embedding comparison
  - Liveness detection (to prevent photo attacks)
  - Quality assessment

### Fraud Detection Features
Your model should analyze:
1. **Face Match Score**: Similarity between captured and registered face
2. **Location Distance**: Distance between check-in location and project site
3. **Time Patterns**: Unusual timing patterns
4. **Behavioral Anomalies**: Suspicious attendance patterns

## Sample Model Architecture

```python
# Databricks notebook example
from pyspark.sql.functions import col, udf
from pyspark.sql.types import StructType, StructField, BooleanType, DoubleType, StringType
import numpy as np

# Define output schema
output_schema = StructType([
    StructField("fraud_detected", BooleanType()),
    StructField("confidence", DoubleType()),
    StructField("alert_type", StringType()),
    StructField("severity", StringType()),
    StructField("description", StringType()),
    StructField("face_match_score", DoubleType()),
    StructField("location_distance_km", DoubleType())
])

@udf(returnType=output_schema)
def analyze_attendance(entity_type, captured_image, registered_image,
                       check_in_lat, check_in_lon,
                       project_lat, project_lon):
    # Your face recognition logic here
    face_match_score = compare_faces(captured_image, registered_image)
    distance = calculate_distance(check_in_lat, check_in_lon,
                                  project_lat, project_lon)

    fraud_detected = face_match_score < 70 or distance > 1.0

    return {
        "fraud_detected": fraud_detected,
        "confidence": 95.0 if not fraud_detected else 85.0,
        "alert_type": "low_face_match" if face_match_score < 70 else "none",
        "severity": "high" if fraud_detected else "low",
        "description": f"Face match: {face_match_score}%, Distance: {distance}km",
        "face_match_score": face_match_score,
        "location_distance_km": distance
    }
```

## Testing

Once configured, test the integration:

1. Log in as a Village Officer
2. Go to Attendance Management
3. Click "Mark Attendance"
4. Select a worker and project
5. Capture a face photo
6. Click "Verify & Mark Attendance"
7. The system will call Databricks for analysis

## Error Handling

If Databricks is not configured, you'll see:
```
"Databricks face verification failed. Please check your Databricks configuration."
```

This is expected behavior - the system **requires** Databricks to mark attendance.

## Support

For Databricks-specific questions:
- Databricks Documentation: https://docs.databricks.com
- Model Serving Guide: https://docs.databricks.com/machine-learning/model-serving/

For integration issues, check the Edge Function logs in Supabase dashboard.

## Cost Considerations

- Databricks charges for compute and model serving
- Model serving endpoints have minimum and maximum cluster sizes
- Consider using serverless endpoints for variable workloads
- Monitor API usage to optimize costs

## Security Best Practices

1. Never commit Databricks tokens to version control
2. Use service principals instead of personal tokens in production
3. Rotate access tokens regularly
4. Monitor API access logs
5. Implement rate limiting on the Edge Function
6. Encrypt face data at rest and in transit

## Next Steps

1. Create Databricks workspace
2. Train and deploy face recognition model
3. Get endpoint URL and access token
4. Configure secrets in Supabase
5. Test the attendance system
6. Monitor accuracy and adjust model as needed
