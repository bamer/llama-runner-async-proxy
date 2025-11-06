# Configuration des ports pour LlamaRunner Pro
# Évite les conflits avec d'autres services

[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor [System.Net.SecurityProtocolType]::Tls12

# Ports utilisés par LlamaRunner Pro
$Global:PortConfig = @{
    # Dashboard de monitoring en temps réel
    "Metrics" = @{
        Port = 8080
        Description = "Dashboard de monitoring temps réel"
        URL = "http://localhost:8080"
        ConflictWarning = $false
    }
    
    # Interface web utilisateur
    "WebUI" = @{
        Port = 8081
        Description = "Interface web utilisateur"
        URL = "http://localhost:8081"
        ConflictWarning = $false
    }
    
    # API LM Studio
    "LmStudio" = @{
        Port = 1234
        Description = "API LM Studio compatible"
        URL = "http://localhost:1234"
        ConflictWarning = $false
    }
    
    # API Ollama
    "Ollama" = @{
        Port = 11434
        Description = "API Ollama compatible"
        URL = "http://localhost:11434"
        ConflictWarning = $false
    }
    
    # Llama.cpp server (si utilisé directement)
    "LlamaServer" = @{
        Port = 8080
        Description = "Llama.cpp server direct"
        URL = "http://localhost:8080"
        ConflictWarning = $true  # Même port que Metrics
    }
}

# Fonction pour vérifier la disponibilité des ports
function Test-PortsAvailable {
    param([hashtable]$PortSettings)
    
    $results = @{}
    foreach ($service in $PortSettings.Keys) {
        $port = $PortSettings[$service].Port
        try {
            $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                $results[$service] = @{
                    Available = $false
                    Warning = $PortSettings[$service].ConflictWarning
                    Message = "Port $port déjà utilisé"
                }
            } else {
                $results[$service] = @{
                    Available = $true
                    Warning = $false
                    Message = "Port $port disponible"
                }
            }
        } catch {
            $results[$service] = @{
                Available = $true
                Warning = $false
                Message = "Port $port disponible (erreur de test: $($_.Exception.Message))"
            }
        }
    }
    
    return $results
}

# Fonction pour afficher les informations des ports
function Show-PortInfo {
    param([hashtable]$PortSettings, [hashtable]$Availability)
    
    Write-Host "`n📡 CONFIGURATION DES PORTS" -ForegroundColor Cyan
    Write-Host "=" * 50 -ForegroundColor Cyan
    
    foreach ($service in $PortSettings.Keys) {
        $config = $PortSettings[$service]
        $availability = $Availability[$service]
        
        $status = if ($availability.Available) { "✅" } else { "⚠️" }
        $color = if ($availability.Available) { "Green" } else { "Yellow" }
        
        Write-Host "$status $($config.Description)" -ForegroundColor $color
        Write-Host "   Port: $($config.Port)" -ForegroundColor Gray
        Write-Host "   URL: $($config.URL)" -ForegroundColor Gray
        Write-Host "   Status: $($availability.Message)" -ForegroundColor $color
        Write-Host ""
    }
}

# Export des fonctions pour utilisation externe
$ExportFunctions = @(
    'Test-PortsAvailable',
    'Show-PortInfo'
)

Export-ModuleMember -Function $ExportFunctions

# Informations de la configuration
Write-Host "✅ Configuration des ports chargée" -ForegroundColor Green
Write-Host "📡 Ports configurés: $($Global:PortConfig.Keys.Count)" -ForegroundColor Gray
