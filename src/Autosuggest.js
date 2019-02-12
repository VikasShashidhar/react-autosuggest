import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { inputFocused, inputBlurred, inputChanged,
  revealSuggestions, closeSuggestions } from './reducerAndActions';
import Autowhatever from 'react-autowhatever';

function mapStateToProps(state) {
  return {
    isFocused: state.isFocused,
    isCollapsed: state.isCollapsed,
    valueBeforeUpDown: state.valueBeforeUpDown,
    lastAction: state.lastAction
  };
}

function mapDispatchToProps(dispatch) {
  return {
    inputFocused: shouldRenderSuggestions => {
      dispatch(inputFocused(shouldRenderSuggestions));
    },
    inputBlurred: () => {
      dispatch(inputBlurred());
    },
    inputChanged: (shouldRenderSuggestions, lastAction) => {
      dispatch(inputChanged(shouldRenderSuggestions, lastAction));
    },
    revealSuggestions: () => {
      dispatch(revealSuggestions());
    },
    closeSuggestions: lastAction => {
      dispatch(closeSuggestions(lastAction));
    }
  };
}

class Autosuggest extends Component {
  static propTypes = {
    suggestions: PropTypes.array.isRequired,
    onSuggestionsUpdateRequested: PropTypes.func.isRequired,
    getSuggestionValue: PropTypes.func.isRequired,
    renderSuggestion: PropTypes.func.isRequired,
    inputProps: PropTypes.object.isRequired,
    shouldRenderSuggestions: PropTypes.func.isRequired,
    onSuggestionSelected: PropTypes.func.isRequired,
    multiSection: PropTypes.bool.isRequired,
    renderSectionTitle: PropTypes.func.isRequired,
    getSectionSuggestions: PropTypes.func.isRequired,
    focusInputOnSuggestionClick: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    inputRef: PropTypes.func.isRequired,
    shouldHideSuggestions: PropTypes.func.isRequired,

    isFocused: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    valueBeforeUpDown: PropTypes.string,
    lastAction: PropTypes.string,

    inputFocused: PropTypes.func.isRequired,
    inputBlurred: PropTypes.func.isRequired,
    inputChanged: PropTypes.func.isRequired,
    revealSuggestions: PropTypes.func.isRequired,
    closeSuggestions: PropTypes.func.isRequired
  };

  constructor() {
    super();

    this.state = {
      focusedSectionIndex: null,
      focusedSuggestionIndex: null,
      valueBeforeUpDown: ''
    };
    this.saveInput = this.saveInput.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.suggestions !== this.props.suggestions) {
      const { suggestions, inputProps, shouldRenderSuggestions,
        isCollapsed, revealSuggestions, lastAction } = nextProps;
      const { value } = inputProps;

      if (isCollapsed && lastAction !== 'click' && lastAction !== 'enter' &&
        suggestions.length > 0 && shouldRenderSuggestions(value)) {
        revealSuggestions();
      }
    }
  }

  getSuggestion(sectionIndex, suggestionIndex) {
    const { suggestions, multiSection, getSectionSuggestions } = this.props;

    if (multiSection) {
      return getSectionSuggestions(suggestions[sectionIndex])[suggestionIndex];
    }

    return suggestions[suggestionIndex];
  }

  getFocusedSuggestion() {
    const { focusedSectionIndex, focusedSuggestionIndex } = this.state;

    if (focusedSuggestionIndex === null) {
      return null;
    }

    return this.getSuggestion(focusedSectionIndex, focusedSuggestionIndex);
  }

  getSuggestionValueByIndex(sectionIndex, suggestionIndex) {
    const { getSuggestionValue } = this.props;

    return getSuggestionValue(this.getSuggestion(sectionIndex, suggestionIndex));
  }

  getSuggestionIndices(suggestionElement) {
    const sectionIndex = suggestionElement.getAttribute('data-section-index');
    const suggestionIndex = suggestionElement.getAttribute('data-suggestion-index');

    return {
      sectionIndex: (typeof sectionIndex === 'string' ? parseInt(sectionIndex, 10) : null),
      suggestionIndex: parseInt(suggestionIndex, 10)
    };
  }

  findSuggestionElement(startNode) {
    let node = startNode;

    do {
      if (node.getAttribute('data-suggestion-index') !== null) {
        return node;
      }

      node = node.parentNode;
    } while (node !== null);

    console.error('Clicked element:', startNode); // eslint-disable-line no-console
    throw new Error('Couldn\'t find suggestion element');
  }

  maybeCallOnChange(event, newValue, method) {
    const { value, onChange } = this.props.inputProps;

    if (newValue !== value) {
      onChange && onChange(event, { newValue, method });
    }
  }

  maybeCallOnSuggestionsUpdateRequested(data) {
    const { onSuggestionsUpdateRequested, shouldRenderSuggestions } = this.props;

    if (shouldRenderSuggestions(data.value)) {
      onSuggestionsUpdateRequested(data);
    }
  }

  willRenderSuggestions() {
    const { suggestions, inputProps, shouldRenderSuggestions } = this.props;
    const { value } = inputProps;

    return suggestions.length > 0 && shouldRenderSuggestions(value);
  }

  saveInput(autowhatever) {
    if (autowhatever !== null) {
      const input = autowhatever.refs.input;

      this.input = input;
      this.props.inputRef(input);
    }
  }

  render() {
    const {
      suggestions, renderSuggestion, inputProps, shouldRenderSuggestions,
      onSuggestionSelected, multiSection, renderSectionTitle, id,
      getSectionSuggestions, focusInputOnSuggestionClick, theme, isFocused,
      isCollapsed, inputFocused, inputBlurred, inputChanged,
      revealSuggestions, closeSuggestions, shouldHideSuggestions
    } = this.props;
    const { focusedSectionIndex, focusedSuggestionIndex, valueBeforeUpDown } = this.state;
    const { value, onBlur, onFocus, onKeyDown } = inputProps;
    const isOpen = isFocused && !isCollapsed && this.willRenderSuggestions();
    const items = (isOpen ? suggestions : []);
    const maybeCloseSuggestions = (method, cb, shouldCloseSuggestions) => {
      var isValid = false;

      if (shouldHideSuggestions(method) && (shouldCloseSuggestions === undefined || shouldCloseSuggestions)) {
        isValid = true;
      }
      if (shouldHideSuggestions(method) && shouldCloseSuggestions !== undefined && shouldCloseSuggestions) {
        isValid = true;
      }
      if (isValid) {
        cb(method);
      }
    };

    const autowhateverInputProps = {
      ...inputProps,
      onFocus: event => {
        if (!this.justClickedOnSuggestion) {
          inputFocused(shouldRenderSuggestions(value));
          onFocus && onFocus(event);
        }
      },
      onBlur: event => {
        this.onBlurEvent = event;

        if (!this.justClickedOnSuggestion) {
          maybeCloseSuggestions('blur', inputBlurred, true);
          this.updateFocusedSuggestion(null, null, null);
          onBlur && onBlur(event);

          if (valueBeforeUpDown !== null && value !== valueBeforeUpDown) {
            this.maybeCallOnSuggestionsUpdateRequested({ value, reason: 'blur' });
          }
        }
      },
      onChange: event => {
        const { value } = event.target;
        const { shouldRenderSuggestions } = this.props;

        this.maybeCallOnChange(event, value, 'type');
        inputChanged(shouldRenderSuggestions(value), 'type');
        this.updateFocusedSuggestion(null, null, null);
        this.maybeCallOnSuggestionsUpdateRequested({ value, reason: 'type' });
      },
      onKeyDown: (event, data) => {
        switch (event.key) {
          case 'ArrowDown':
          case 'ArrowUp':
            if (isCollapsed) {
              if (this.willRenderSuggestions()) {
                revealSuggestions();
              }
            } else if (suggestions.length > 0) {
              const { newFocusedSectionIndex, newFocusedItemIndex } = data;
              const newValue = newFocusedItemIndex === null ?
                valueBeforeUpDown :
                this.getSuggestionValueByIndex(newFocusedSectionIndex, newFocusedItemIndex);

              var updatedFocusedItemIndex = newFocusedItemIndex,
                updatedFocusedSectionIndex = newFocusedSectionIndex;

              if (updatedFocusedItemIndex !== null && updatedFocusedSectionIndex !== null) {
                var shouldFocusSuggestion = this.props.suggestions[updatedFocusedSectionIndex].items[updatedFocusedItemIndex].shouldFocusSuggestion;

                /* Focus a suggestion only if it is required to
                 * be. For certain section headers, skip focus.
                 * See SEARCH-577
                 */
                if ((shouldFocusSuggestion !== undefined && shouldFocusSuggestion !== null) && !shouldFocusSuggestion) {
                  if (event.key === 'ArrowDown') {
                    // Update the focus to the item below the current one on arrow down
                    updatedFocusedItemIndex += 1;
                  }
                  if (event.key === 'ArrowUp') {
                    // Update the focus to the the item above the current one on arrow up only if it's not the first item
                    if (updatedFocusedSectionIndex > 0) {
                      updatedFocusedSectionIndex -= 1;
                      updatedFocusedItemIndex = this.props.suggestions[updatedFocusedSectionIndex].items.length - 1;
                    } else {
                      updatedFocusedSectionIndex = null;
                      updatedFocusedItemIndex = null;
                    }
                  }
                }
              }
              this.updateFocusedSuggestion(updatedFocusedSectionIndex, updatedFocusedItemIndex, value);
              this.maybeCallOnChange(event, newValue, event.key === 'ArrowDown' ? 'down' : 'up');
            }
            event.preventDefault();
            break;

          case 'Enter': {
            const focusedSuggestion = this.getFocusedSuggestion();

            if (focusedSuggestion !== null) {
              onSuggestionSelected(event, {
                suggestion: focusedSuggestion,
                suggestionValue: value,
                sectionIndex: focusedSectionIndex,
                method: 'enter'
              });
              maybeCloseSuggestions('enter', closeSuggestions, focusedSuggestion.shouldCloseSuggestions);
              this.maybeCallOnSuggestionsUpdateRequested({ value, reason: 'enter' });

              this.updateFocusedSuggestion(null, null);
            }
            break;
          }

          case 'Tab': {
            this.updateFocusedSuggestion(null, null);
            break;
          }

          case 'Escape':
            if (isOpen) {
              // If input.type === 'search', the browser clears the input
              // when Escape is pressed. We want to disable this default
              // behaviour so that, when suggestions are shown, we just hide
              // them, without clearing the input.
              event.preventDefault();
            }

            if (valueBeforeUpDown === null) { // Didn't interact with Up/Down
              if (!isOpen) {
                this.maybeCallOnChange(event, '', 'escape');
                this.maybeCallOnSuggestionsUpdateRequested({ value: '', reason: 'escape' });
              }
            } else { // Interacted with Up/Down
              this.maybeCallOnChange(event, valueBeforeUpDown, 'escape');
            }

            maybeCloseSuggestions('escape', closeSuggestions, true);
            break;
        }

        onKeyDown && onKeyDown(event, data);
      }
    };
    const onMouseEnter = (event, { sectionIndex, itemIndex }) => {
      const shouldFocusSuggestion = this.props.suggestions[sectionIndex].items[itemIndex].shouldFocusSuggestion;

      let updatedSectionIndex = sectionIndex;
      let updatedItemIndex = itemIndex;

      if ((shouldFocusSuggestion !== undefined && shouldFocusSuggestion !== null) && !shouldFocusSuggestion) {
        updatedSectionIndex = null;
        updatedItemIndex = null;
      }

      this.updateFocusedSuggestion(updatedSectionIndex, updatedItemIndex);
    };
    const onMouseLeave = () => {
      this.updateFocusedSuggestion(null, null);
    };
    const onMouseDown = () => {
      this.justClickedOnSuggestion = true;
      this.updateFocusedSuggestion(null, null);
    };
    const onClick = event => {
      const { sectionIndex, suggestionIndex } =
        this.getSuggestionIndices(this.findSuggestionElement(event.target));
      const clickedSuggestion = this.getSuggestion(sectionIndex, suggestionIndex);
      const clickedSuggestionValue = this.props.getSuggestionValue(clickedSuggestion);

      this.maybeCallOnChange(event, clickedSuggestionValue, 'click');
      onSuggestionSelected(event, {
        suggestion: clickedSuggestion,
        suggestionValue: clickedSuggestionValue,
        sectionIndex,
        method: 'click'
      });
      maybeCloseSuggestions('click', closeSuggestions, clickedSuggestion.shouldCloseSuggestions);

      if (focusInputOnSuggestionClick === true) {
        this.input.focus();
      } else {
        maybeCloseSuggestions('blur', inputBlurred, true);
        this.updateFocusedSuggestion(null, null, null);
        onBlur && onBlur(this.onBlurEvent);
      }

      this.maybeCallOnSuggestionsUpdateRequested({ value: clickedSuggestionValue, reason: 'click' });

      setTimeout(() => {
        this.justClickedOnSuggestion = false;
      });
    };
    const itemProps = ({ sectionIndex, itemIndex }) => {
      return {
        'data-section-index': sectionIndex,
        'data-suggestion-index': itemIndex,
        onMouseEnter,
        onMouseLeave,
        onMouseDown,
        onTouchStart: onMouseDown, // Because on iOS `onMouseDown` is not triggered
        onClick
      };
    };
    const renderItem = item => renderSuggestion(item, { value, valueBeforeUpDown });

    return (
      <Autowhatever multiSection={multiSection}
                    items={items}
                    renderItem={renderItem}
                    renderSectionTitle={renderSectionTitle}
                    getSectionItems={getSectionSuggestions}
                    focusedSectionIndex={focusedSectionIndex}
                    focusedItemIndex={focusedSuggestionIndex}
                    inputProps={autowhateverInputProps}
                    itemProps={itemProps}
                    theme={theme}
                    id={id}
                    ref={this.saveInput} />
    );
  }

  updateFocusedSuggestion(sectionIndex, suggestionIndex, value) {
    this.setState({ focusedSectionIndex: sectionIndex, focusedSuggestionIndex: suggestionIndex, valueBeforeUpDown: value });
  }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(Autosuggest);
