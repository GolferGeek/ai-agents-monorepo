import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LangGraphModule } from './lang-graph/lang-graph.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
      expandVariables: true,
      // Load .env.local if it exists, fallback to .env
      ignoreEnvFile: false,
      // Throw an error if .env is missing
      validate: (config: Record<string, any>) => {
        const requiredEnvVars = [
          'PORT',
          'NODE_ENV',
          'OPENAI_API_KEY',
          'ANTHROPIC_API_KEY',
          'TAVILY_API_KEY'
        ];

        for (const envVar of requiredEnvVars) {
          if (!config[envVar]) {
            throw new Error(`Environment variable ${envVar} is required`);
          }
        }
        return config;
      },
    }),
    LangGraphModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
