// src/lib/microsoft/graph-client.ts
import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'

// Tipos
export interface SharePointFile {
  id: string
  name: string
  size: number
  webUrl: string
  lastModifiedDateTime: string
  file?: {
    mimeType: string
  }
}

export interface DriveItem {
  id: string
  name: string
  folder?: { childCount: number }
  file?: { mimeType: string }
  size: number
  lastModifiedDateTime: string
  webUrl: string
}

class GraphClient {
  private client: Client | null = null
  private initialized = false

  /**
   * Inicializa o cliente do Microsoft Graph
   */
  private async getClient(): Promise<Client> {
    if (this.client && this.initialized) {
      return this.client
    }

    const tenantId = process.env.AZURE_TENANT_ID
    const clientId = process.env.AZURE_CLIENT_ID
    const clientSecret = process.env.AZURE_CLIENT_SECRET

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Variáveis Azure AD não configuradas (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)')
    }

    // Criar credencial
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret)

    // Criar provider de autenticação
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    })

    // Criar cliente
    this.client = Client.initWithMiddleware({
      authProvider,
    })

    this.initialized = true
    return this.client
  }

  /**
   * Lista arquivos na pasta base (SHAREPOINT_FOLDER_PATH)
   */
  async listFiles(folderPath?: string): Promise<DriveItem[]> {
    try {
      const client = await this.getClient()
      const siteId = process.env.SHAREPOINT_SITE_ID
      const basePath = process.env.SHAREPOINT_FOLDER_PATH || '/SISTEMA'

      if (!siteId) {
        throw new Error('SHAREPOINT_SITE_ID não configurado')
      }

      const path = folderPath ? `${basePath}/${folderPath}` : basePath
      console.log(`Listando arquivos em: ${path}`)

      const response = await client
        .api(`/sites/${siteId}/drive/root:${path}:/children`)
        .select('id,name,size,webUrl,lastModifiedDateTime,file,folder')
        .get()

      return response.value || []
    } catch (error) {
      console.error('Erro ao listar arquivos:', error)
      throw error
    }
  }

  /**
   * Lista arquivos em uma subpasta específica
   */
  async listFilesInFolder(folderName: string): Promise<DriveItem[]> {
    return this.listFiles(folderName)
  }

  /**
   * Baixa arquivo pelo ID (mais confiável)
   */
  async downloadFileById(fileId: string): Promise<Buffer> {
    try {
      const client = await this.getClient()
      const siteId = process.env.SHAREPOINT_SITE_ID

      if (!siteId) {
        throw new Error('SHAREPOINT_SITE_ID não configurado')
      }

      const response = await client
        .api(`/sites/${siteId}/drive/items/${fileId}/content`)
        .responseType('arraybuffer' as any)
        .get()

      return Buffer.from(response)
    } catch (error) {
      console.error('Erro ao baixar arquivo por ID:', error)
      throw error
    }
  }

  /**
   * Busca um arquivo específico pelo nome
   */
  async findFile(fileName: string, folderPath?: string): Promise<DriveItem | null> {
    try {
      const files = await this.listFiles(folderPath)
      return files.find((f: DriveItem) => f.name.toLowerCase() === fileName.toLowerCase()) || null
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error)
      return null
    }
  }

  /**
   * Baixa o conteúdo de um arquivo como Buffer (alias para downloadFileById)
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    return this.downloadFileById(fileId)
  }

  /**
   * Baixa arquivo pelo caminho
   */
  async downloadFileByPath(filePath: string): Promise<Buffer> {
    try {
      const client = await this.getClient()
      const siteId = process.env.SHAREPOINT_SITE_ID
      const basePath = process.env.SHAREPOINT_FOLDER_PATH || '/SISTEMA'

      if (!siteId) {
        throw new Error('SHAREPOINT_SITE_ID não configurado')
      }

      const fullPath = `${basePath}/${filePath}`
      console.log(`Baixando arquivo: ${fullPath}`)

      const response = await client
        .api(`/sites/${siteId}/drive/root:${fullPath}:/content`)
        .responseType('arraybuffer' as any)
        .get()

      return Buffer.from(response)
    } catch (error) {
      console.error('Erro ao baixar arquivo por caminho:', error)
      throw error
    }
  }

  /**
   * Testa conexão com o SharePoint
   */
  async testConnection(): Promise<{ success: boolean; message: string; files?: DriveItem[] }> {
    try {
      const files = await this.listFiles()
      return {
        success: true,
        message: `Conectado! ${files.length} arquivo(s) encontrado(s)`,
        files
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro desconhecido'
      }
    }
  }
}

// Singleton
export const graphClient = new GraphClient()