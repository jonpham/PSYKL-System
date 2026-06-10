{{/* Standard chart label set. */}}
{{- define "psykl.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: psykl
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "psykl.serviceTask.selectorLabels" -}}
app.kubernetes.io/name: psykl
app.kubernetes.io/component: service-task
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "psykl.webClient.selectorLabels" -}}
app.kubernetes.io/name: psykl
app.kubernetes.io/component: web-client
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
