import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSubmission,
  setModel,
  setDisabled,
  setCustomGpt,
  setCustomModel
} from '~/store/submitSlice';
import { setNewConvo } from '~/store/convoSlice';
import ModelDialog from './ModelDialog';
import MenuItems from './MenuItems';
import { swr } from '~/utils/fetchers';
import { setModels, setInitial } from '~/store/modelSlice';
import { setMessages } from '~/store/messageSlice';
import { setText } from '~/store/textSlice';
import { Button } from '../ui/Button.tsx';
import { getIconOfModel } from '../../utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/DropdownMenu.tsx';

import { Dialog } from '../ui/Dialog.tsx';

export default function ModelMenu() {
  const dispatch = useDispatch();
  const [modelSave, setModelSave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { model, customModel, promptPrefix, chatGptLabel } = useSelector((state) => state.submit);
  const { models, modelMap, initial } = useSelector((state) => state.models);
  const { data, isLoading, mutate } = swr(`/api/customGpts`, (res) => {
    const fetchedModels = res.map((modelItem) => ({
      ...modelItem,
      name: modelItem.chatGptLabel
    }));

    dispatch(setModels(fetchedModels));
  });

  useEffect(() => {
    mutate();
    try {
      const lastSelected = JSON.parse(localStorage.getItem('model'));

      if (lastSelected === 'chatgptCustom') {
        return;
      } else if (initial[lastSelected]) {
        dispatch(setModel(lastSelected));
      }
    } catch (err) {
      console.log(err);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    axios.get('/api/models', {
      timeout: 1000,
      withCredentials: true
    }).then((res) => {
      return res.data
    }).then((data) => {
      const initial = {chatgpt: data?.hasOpenAI, chatgptCustom: data?.hasOpenAI, bingai: data?.hasBing, sydney: data?.hasBing, chatgptBrowser: data?.hasChatGpt}
      dispatch(setInitial(initial))
      // TODO, auto reset default model
      if (data?.hasOpenAI) {
        dispatch(setModel('chatgpt'));
        dispatch(setDisabled(false));
        dispatch(setCustomModel(null));
        dispatch(setCustomGpt({ chatGptLabel: null, promptPrefix: null }));
      } else if (data?.hasBing) {
        dispatch(setModel('bingai'));
        dispatch(setDisabled(false));
        dispatch(setCustomModel(null));
        dispatch(setCustomGpt({ chatGptLabel: null, promptPrefix: null }));
      } else if (data?.hasChatGpt) {
        dispatch(setModel('chatgptBrowser'));
        dispatch(setDisabled(false));
        dispatch(setCustomModel(null));
        dispatch(setCustomGpt({ chatGptLabel: null, promptPrefix: null }));
      } else {
        dispatch(setDisabled(true));
      }
    }).catch((error) => {
      console.error(error)
      console.log('Not login!')
      window.location.href = "/auth/login";
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('model', JSON.stringify(model));
  }, [model]);

  const filteredModels = models.filter(({model, _id }) => initial[model] || _id.length > 1 );

  const onChange = (value) => {
    if (!value) {
      return;
    } else if (value === model) {
      return;
    } else if (value === 'chatgptCustom') {
      // return;
    } else if (initial[value]) {
      dispatch(setModel(value));
      dispatch(setDisabled(false));
      dispatch(setCustomModel(null));
      dispatch(setCustomGpt({ chatGptLabel: null, promptPrefix: null }));
    } else if (!initial[value]) {
      const chatGptLabel = modelMap[value]?.chatGptLabel;
      const promptPrefix = modelMap[value]?.promptPrefix;
      dispatch(setCustomGpt({ chatGptLabel, promptPrefix }));
      dispatch(setModel('chatgptCustom'));
      dispatch(setCustomModel(value));
      setMenuOpen(false);
    } else if (!modelMap[value]) {
      dispatch(setCustomModel(null));
    }

    // Set new conversation
    dispatch(setText(''));
    dispatch(setMessages([]));
    dispatch(setNewConvo());
    dispatch(setSubmission({}));
  };

  const onOpenChange = (open) => {
    mutate();
    if (!open) {
      setModelSave(false);
    }
  };

  const handleSaveState = (value) => {
    if (!modelSave) {
      return;
    }

    dispatch(setCustomModel(value));
    setModelSave(false);
  };

  const defaultColorProps = [
    'text-gray-500',
    'hover:bg-gray-100',
    'hover:bg-opacity-20',
    'disabled:hover:bg-transparent',
    'dark:data-[state=open]:bg-gray-800',
    'dark:hover:bg-opacity-20',
    'dark:hover:bg-gray-900',
    'dark:hover:text-gray-400',
    'dark:disabled:hover:bg-transparent'
  ];

  const chatgptColorProps = [
    'text-green-700',
    'data-[state=open]:bg-green-100',
    'dark:text-emerald-300',
    'hover:bg-green-100',
    'disabled:hover:bg-transparent',
    'dark:data-[state=open]:bg-green-900',
    'dark:hover:bg-opacity-50',
    'dark:hover:bg-green-900',
    'dark:hover:text-gray-100',
    'dark:disabled:hover:bg-transparent'
  ];

  const isBing = model === 'bingai' || model === 'sydney';
  const colorProps = model === 'chatgpt' ? chatgptColorProps : defaultColorProps;
  const icon = getIconOfModel({ size: 32, sender: chatGptLabel || model, isCreatedByUser: false, model, chatGptLabel, promptPrefix, error: false, button: true});

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DropdownMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            // style={{backgroundColor: 'rgb(16, 163, 127)'}}
            className={`absolute top-[0.25px] items-center mb-0 rounded-md border-0 p-1 ml-1 md:ml-0 outline-none ${colorProps.join(
              ' '
            )} focus:ring-0 focus:ring-offset-0 disabled:top-[0.25px] dark:data-[state=open]:bg-opacity-50 md:top-1 md:left-1 md:pl-1 md:disabled:top-1`}
          >
            {icon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 dark:bg-gray-700" onCloseAutoFocus={(event) => event.preventDefault()}>
          <DropdownMenuLabel className="dark:text-gray-300">Select a Model</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={customModel ? customModel : model}
            onValueChange={onChange}
            className="overflow-y-auto"
          >
            {filteredModels.length?
              <MenuItems
                models={filteredModels}
                onSelect={onChange}
              />:<DropdownMenuLabel className="dark:text-gray-300">No model available.</DropdownMenuLabel>
            }
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ModelDialog
        mutate={mutate}
        modelMap={modelMap}
        setModelSave={setModelSave}
        handleSaveState={handleSaveState}
      />
    </Dialog>
  );
}
