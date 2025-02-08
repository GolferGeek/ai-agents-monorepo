from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict
from enum import Enum
import agentops
from crew import PostGeneratorCrew
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/post-generator", tags=["Post Generator"])

class AgentType(str, Enum):
    OUTLINE_ARCHITECT = "outline_architect"
    CONTENT_EXPANDER = "content_expander"
    DEBATE_ANALYST = "debate_analyst"
    CREATIVE_DIRECTOR = "creative_director"
    CONTENT_REVIEWER = "content_reviewer"

class LLMConfig(BaseModel):
    provider: str
    model: str
    temperature: float = 0.7
    api_key: str = ""  # Optional for Ollama
    base_url: Optional[str] = None  # Required for Ollama, optional for others

class PostGeneratorInput(BaseModel):
    post_idea: str
    tone_preference: str
    target_word_count: str
    perspective: str
    image_style_preference: str
    agent_llm_configs: Dict[AgentType, LLMConfig]
    agentops_api_key: Optional[str] = None  # Optional AgentOps API key

class PostGeneratorResponse(BaseModel):
    status: str
    outline: Optional[str] = None
    content: Optional[str] = None
    counterarguments: Optional[str] = None
    illustration_prompt: Optional[str] = None
    illustration_url: Optional[str] = None
    review: Optional[str] = None
    raw_result: str

@router.post("/generate", response_model=PostGeneratorResponse)
async def generate_post(input_data: PostGeneratorInput):
    """
    Generate a structured post based on the provided input parameters.
    Each agent can be configured with its own LLM settings.
    
    Returns a JSON object containing:
    - status: Success/failure status of the request
    - outline: The structured outline from the Outline Architect
    - content: The expanded content from the Content Expander
    - counterarguments: The counterarguments from the Debate Analyst
    - illustration_prompt: The DALL-E prompt from the Creative Director
    - illustration_url: The generated illustration URL
    - review: The final review from the Content Reviewer
    - raw_result: The complete output from all agents in sequence
    
    Providers and Models:
    - OpenAI: o3-mini (new), gpt-4-0125-preview, gpt-4-turbo-preview, gpt-4, gpt-3.5-turbo-0125, gpt-3.5-turbo (requires api_key)
    - Anthropic: claude-3-5-sonnet-20241022, claude-3-opus-20240229 (o3), claude-3-sonnet-20240229 (s3), claude-3-haiku-20240307 (h3) (requires api_key)
    - Ollama: llama2, mistral, mixtral, etc. (requires base_url, default: http://localhost:11434)
    
    Note: If no API key is provided for OpenAI or Anthropic models, the agent will
    automatically fall back to using the Ollama Mixtral model.
    
    Optional: Provide an AgentOps API key to track and analyze agent performance.
    
    Example agent_llm_configs:
    {
        "outline_architect": {
            "provider": "anthropic",
            "model": "claude-3-5-sonnet-20241022",  # Latest Anthropic model
            "temperature": 0.7,
            "api_key": "sk-ant-..."  # Required for Anthropic
        },
        "content_expander": {
            "provider": "openai",
            "model": "o3-mini",
            "temperature": 0.8,
            "api_key": "sk-..."  # Required for OpenAI
        },
        "creative_director": {
            "provider": "openai",
            "model": "gpt-4-0125-preview",  # More capable for creative tasks
            "temperature": 0.7,
            "api_key": "sk-..."  # Required for OpenAI
        }
    }
    
    If no configuration is provided for an agent, it will use Ollama's Mixtral model
    as a default fallback.
    """
    try:
        logger.debug(f"Received request with data: {input_data}")
        
        # Initialize AgentOps if API key is provided
        if input_data.agentops_api_key:
            try:
                agentops.init(input_data.agentops_api_key)
                logger.debug("AgentOps initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize AgentOps: {str(e)}")
                logger.warning("Continuing without AgentOps tracking")
        
        # Create agent-specific LLM configurations
        agent_configs = {}
        
        for agent_type, llm_config in input_data.agent_llm_configs.items():
            logger.debug(f"Processing config for agent {agent_type}: {llm_config}")
            config = {
                "temperature": llm_config.temperature,
                "provider": llm_config.provider,
                "model": llm_config.model
            }
            
            # Always include API key if provided
            if llm_config.api_key:
                config["api_key"] = llm_config.api_key
                logger.debug(f"Added API key for {agent_type}")
            
            # Add base_url for Ollama
            if llm_config.provider == "ollama":
                config["base_url"] = llm_config.base_url or "http://localhost:11434"
            
            # Use the enum value as the key
            agent_configs[agent_type.value] = config
            logger.debug(f"Final config for {agent_type}: {config}")
        
        # Convert input to dict and remove llm fields
        inputs = input_data.dict()
        inputs.pop("agent_llm_configs")
        inputs.pop("agentops_api_key")
        
        logger.debug(f"Creating crew with configs: {agent_configs}")
        crew = PostGeneratorCrew(agent_configs=agent_configs, inputs=inputs)
        
        logger.debug(f"Executing crew with inputs: {inputs}")
        # Execute crew tasks and get full result
        crew_instance = crew.crew()
        result = crew_instance.kickoff()
        
        # Get the full output from all agents
        full_output = []
        response_data = {
            "status": "success",
            "raw_result": "",
            "outline": None,
            "content": None,
            "counterarguments": None,
            "illustration_prompt": None,
            "illustration_url": None,
            "review": None
        }
        
        for task in crew_instance.tasks:
            # Convert task output to string
            output_str = str(task.output) if task.output is not None else ""
            task_output = f"# Agent: {task.agent.role}\n## Task: {task.description}\n\n{output_str}\n\n"
            full_output.append(task_output)
            
            # Map each agent's output to the corresponding response field
            if task.agent.role == "Outline Architect":
                response_data["outline"] = output_str
            elif task.agent.role == "Content Expander":
                response_data["content"] = output_str
            elif task.agent.role == "Debate Analyst":
                response_data["counterarguments"] = output_str
            elif task.agent.role == "Creative Director":
                if not response_data["illustration_prompt"]:
                    response_data["illustration_prompt"] = output_str
                else:
                    response_data["illustration_url"] = output_str
            elif task.agent.role == "Content Reviewer":
                response_data["review"] = output_str
        
        # Set the raw_result to the complete output
        response_data["raw_result"] = "\n".join(full_output)
        logger.debug(f"Complete crew result: {response_data}")
        
        return response_data
    except Exception as e:
        logger.error(f"Error in generate_post: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 