# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from typing import Any, Dict, List

from langchain.schema import BaseMemory
from pydantic import BaseModel

class EntityContextMemory(BaseMemory, BaseModel):
    memory_key: str = 'context'
    selected_entity: str = None
    
    @property
    def memory_variables(self) -> List[str]:
        return [self.memory_key]
    
    def clear(self) -> None:
        print('clearing memory')
        self.selected_entity = None
    
    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        print('load memory variables', inputs)
        context = ''
        if self.selected_entity:
            context = 'the current selected entity is \'' + self.selected_entity + '\''
        print('context', context)
        
        return {
            self.memory_key: context
        }
    
    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        if 'selected_entity' in outputs:
            self.selected_entity = outputs['selected_entity']
